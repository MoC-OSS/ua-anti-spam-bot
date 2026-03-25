---
name: aws-debug
description: Debug AWS ECS/Fargate deployment failures, service crashes, and pipeline issues. Covers the full investigation workflow from pipeline to container logs.
version: 1.0.0
---

# AWS Deployment Debug Skill

You are debugging an AWS deployment failure. Follow the methodology below systematically. Do not jump to conclusions — gather evidence from every layer before proposing fixes.

> **Rule:** Always state which environment / account / region / pipeline / service you are currently inspecting, so the user can follow along.

> **Rule:** After each major investigation step, summarize: what's healthy, what's suspicious, what to inspect next.

> **Rule:** Compare stage vs prod before concluding. A problem that exists in one environment but not the other is a configuration drift issue, not a code issue.

## Phase 1 — Restore observability first

You cannot debug what you cannot see. Before investigating any failure:

1. **Check every task definition for `logConfiguration`.** If a container has no log driver, failed tasks produce zero CloudWatch output. Fix this immediately — nothing else matters until logs exist.

```bash
aws ecs describe-task-definition --task-definition <family> --region <region> \
  --query 'taskDefinition.containerDefinitions[*].{name:name,logConfig:logConfiguration}'
```

2. If missing, register a new task definition revision with logging enabled:

```json
{
  "logDriver": "awslogs",
  "options": {
    "awslogs-group": "/ecs/<service-name>",
    "awslogs-create-group": "true",
    "awslogs-region": "<region>",
    "awslogs-stream-prefix": "ecs"
  }
}
```

3. Deploy the updated task definition to the service so new tasks produce logs.

## Phase 2 — Map the deployment topology

This project has no IaC. All infrastructure is configured via the AWS Console. Reverse-engineer the architecture before debugging:

```bash
# Pipeline structure (source trigger, build project, deploy actions)
aws codepipeline get-pipeline --name <pipeline> --region <region>

# Build configuration (inline buildspec, env vars, which Dockerfiles)
aws codebuild batch-get-projects --names <project> --region <region> \
  --query 'projects[0].source.buildspec'

# What the pipeline ACTUALLY used (may differ from current project config)
aws codebuild batch-get-builds --ids <build-id> --region <region> \
  --query 'builds[0].source.buildspec'

# ECR repositories and image tags
aws ecr describe-repositories --region <region>
aws ecr describe-images --repository-name <repo> --region <region> \
  --query 'imageDetails[?imageTags!=`null`].[imageTags,imagePushedAt]'

# ECS services, task definitions, ALB target groups
aws ecs describe-services --cluster <cluster> --services <svc1> <svc2> --region <region>
aws elbv2 describe-target-groups --region <region>
```

**Key things to verify:**
- Which branch triggers which pipeline? (`pipeline.triggers[].gitConfiguration.push[].branches`)
- Does the buildspec build separate images for each service, or one shared image?
- Do imagedefinitions container names match the container names in task definitions?
- Does each pipeline push to the correct ECR repository?

## Phase 3 — Investigate pipeline failures

For each failed pipeline execution:

```bash
# List recent executions
aws codepipeline list-pipeline-executions --pipeline-name <pipeline> --region <region> --max-items 5

# Check which stage/action failed
aws codepipeline list-action-executions --pipeline-name <pipeline> \
  --filter pipelineExecutionId=<id> --region <region> \
  --query 'actionExecutionDetails[*].{stage:stageName,action:actionName,status:status,summary:output.executionResult.externalExecutionSummary}'
```

**If Build failed:** Check CodeBuild logs. Common causes: Docker build failure, ECR push auth failure, buildspec syntax.

**If Deploy failed:** The ECS deployment didn't complete. Check for:
- "The new deployment has failed and rolled back" = circuit breaker triggered
- Check ECS service events for the timeline of what happened

## Phase 4 — Investigate ECS service failures

This is where most issues hide. Check three layers:

### Layer 1: Service events

```bash
aws ecs describe-services --cluster <cluster> --services <svc> --region <region> \
  --query 'services[0].{deployConfig:deploymentConfiguration,deployments:deployments[*].{taskDef:taskDefinition,running:runningCount,desired:desiredCount,failed:failedTasks,rolloutState:rolloutState},events:events[0:10]}'
```

Read events chronologically. Look for:
- "has started 1 tasks" followed by "registered 1 targets" = task started and entered ALB
- "deregistered 1 targets" shortly after = health check failed or task died
- Rapid cycling (start → register → deregister → start) = crash loop or health check timeout

### Layer 2: Task stop reasons

```bash
aws ecs describe-tasks --cluster <cluster> --tasks <task-id> --region <region> \
  --query 'tasks[0].{stopCode:stopCode,stopReason:stoppedReason,containers:containers[*].{name:name,exitCode:exitCode,reason:reason}}'
```

**Decode the results:**

| exitCode | container reason | Meaning |
|----------|-----------------|---------|
| 0 | — | Graceful shutdown (SIGTERM from ECS) |
| 1 | — | Application error (unhandled exception) |
| 137 | `OutOfMemoryError: container killed due to memory usage` | OOM kill. Increase task memory. |
| 137 | — (no OOM message) | SIGKILL — killed externally (health check or ECS stop) |
| null | `CannotPullContainerError` | Image doesn't exist in ECR or IAM can't pull |

### Layer 3: Container logs

```bash
# Find log streams for recent tasks
aws logs describe-log-streams --log-group-name /ecs/<service> \
  --order-by LastEventTime --descending --max-items 5 --region <region>

# Read the END of a crashed task's logs (crash reason is always at the tail)
aws logs get-log-events --log-group-name /ecs/<service> \
  --log-stream-name "<stream>" --no-start-from-head --limit 30 --region <region> \
  --query 'events[*].[timestamp,message]' --output text
```

**Read logs tail-first.** The crash reason is always in the last few lines. Common patterns:
- `Emitted 'error' event on ...` → unhandled Node.js EventEmitter error, process killed
- `JavaScript heap out of memory` → Node.js OOM (different from container OOM)
- Last log is mid-operation with no error → external kill (OOM, health check, SIGKILL)
- `npm notice` as the very last line → process exited (npm prints this on exit)

## Phase 5 — Check health check configuration

Health check misconfiguration is the most common cause of deployment failures for slow-starting apps. There are TWO independent health check systems:

### ALB target group health check

```bash
aws elbv2 describe-target-groups --region <region> \
  --query 'TargetGroups[*].{name:TargetGroupName,port:Port,path:HealthCheckPath,interval:HealthCheckIntervalSeconds,healthy:HealthyThresholdCount,unhealthy:UnhealthyThresholdCount}'
```

**Math:** `UnhealthyThreshold * HealthCheckIntervalSeconds` = max seconds before ALB declares target dead. This MUST exceed the application's cold-start time.

```bash
# Check current target health
aws elbv2 describe-target-health --target-group-arn <arn> --region <region>
```

### ECS container health check

Defined in the task definition's `containerDefinitions[].healthCheck`. Has its own `startPeriod` (grace period before checks begin), `interval`, `retries`, and `timeout`.

**Common misconfiguration:** ALB unhealthy threshold too low while the app takes 60-90 seconds to start. The ALB kills the target before the app is ready, ECS sees the task as failed, and the deployment rolls back or loops.

## Phase 6 — Check deployment configuration

```bash
aws ecs describe-services --cluster <cluster> --services <svc> --region <region> \
  --query 'services[0].deploymentConfiguration'
```

**Critical settings:**

| Setting | Bad value | Good value | Why |
|---------|-----------|------------|-----|
| maximumPercent | 100 | 200 | 100 means ECS can't start a new task alongside the old one |
| minimumHealthyPercent | 0 | 100 | 0 means ECS may kill all tasks before new ones are ready |
| circuit breaker | disabled | enabled + rollback | Without it, a bad deployment loops forever |

**The deadly combo:** `maxPercent:100 + minHealthyPercent:0` guarantees downtime on every deployment. ECS stops the old task first (minHealthy=0 allows it), then starts the new one (maxPercent=100 means only 1 at a time). If the new task fails, there are zero running tasks.

## Phase 7 — Compare stage vs production

After investigating both environments, diff every configurable surface:

| Check | Command |
|-------|---------|
| Task def memory/CPU | `describe-task-definition` |
| Task def env vars | `describe-task-definition` → `containerDefinitions[].environment` |
| Task def log config | `describe-task-definition` → `containerDefinitions[].logConfiguration` |
| ALB health thresholds | `describe-target-groups` |
| Deployment config | `describe-services` → `deploymentConfiguration` |
| Pipeline trigger branch | `get-pipeline` → `triggers` |
| ECR image tags | `describe-images` |

Any difference is a potential drift bug. Flag every discrepancy.

## Fix priority order

Always fix in this order:

1. **P0 — Observability** (add logging). You cannot debug without it.
2. **P0 — Active crashes** (application bugs, OOM kills). The service is down.
3. **P1 — Deployment config** (min/max percent, circuit breaker). Prevents safe rollouts.
4. **P1 — Health check thresholds** (ALB + container). Kills healthy tasks prematurely.
5. **P1 — Pipeline config** (triggers, buildspec, image tags). Wrong code gets deployed.
6. **P2 — Config drift** (env var differences, memory mismatches). Works today, breaks tomorrow.

## Common gotchas learned from this project

- **CodeBuild buildspec from the project vs from the build:** The current project buildspec may differ from what a past build used. Always check `batch-get-builds` to see the actual buildspec that ran, not just the current project config.
- **Fargate OOM has no in-container trace.** The process just disappears. The only evidence is `exitCode: 137` + `reason: OutOfMemoryError` on the task description. Logs will show the process mid-operation with no error, then nothing.
- **`npm notice` as the last log line** is Node.js/npm printing on process exit. It means the process ended — look at what came before it for the actual cause.
- **Unhandled EventEmitter `error` events in Node.js** kill the entire process with no catch. Libraries like `fluent-ffmpeg` emit these. Always check for missing `.on('error', ...)` handlers.
- **A service at "steady state" doesn't mean it's healthy.** It means the deployment stabilized. If the circuit breaker rolled back, "steady state" means it's running the OLD task definition, not the new one. Always check which task definition revision is active.
- **Container health check vs ALB health check** are independent systems. Removing the container health check doesn't fix ALB-based kills, and vice versa. Test each independently when debugging.
- **Task definitions are immutable.** You can't edit a revision — you register a new one. When fixing task def issues, always register a new revision and update the service to use it.
