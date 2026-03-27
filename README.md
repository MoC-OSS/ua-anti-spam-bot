<p align="center">
  <img src="docs/logo.svg" alt="UA Anti Spam Bot Logo" width="120" height="120" />
</p>

<h1 align="center">UA Anti Spam Bot</h1>

<p align="center">
  <strong>Intelligent spam protection for Ukrainian Telegram communities</strong>
</p>

<p align="center">
  <a href="https://github.com/MoC-OSS/ua-anti-spam-bot/commits/develop">
    <img src="https://img.shields.io/github/last-commit/MoC-OSS/ua-anti-spam-bot.svg" alt="Last Commit" />
  </a>
  <a href="https://grammy.dev">
    <img src="https://img.shields.io/badge/powered%20by-grammY-2960AD" alt="Powered by grammY" />
  </a>
  <a href="https://nodejs.org">
    <img src="https://img.shields.io/badge/runtime-Node.js%2024-339933?logo=node.js&logoColor=white" alt="Node.js 24" />
  </a>
  <a href="https://www.typescriptlang.org">
    <img src="https://img.shields.io/badge/language-TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  </a>
</p>

---

**UA Anti Spam Bot** is a production-grade Node.js bot that detects and removes spam from Ukrainian-language Telegram groups and channels. It combines machine learning models (TensorFlow.js), natural language processing, and rule-based filters to keep communities safe and clean.

### Key capabilities

- **ML-powered spam detection** — TensorFlow.js models trained on Ukrainian-language data
- **NSFW image filtering** — automatic moderation of inappropriate media
- **Swindler & scam detection** — pattern-based identification of fraud attempts
- **Configurable per-chat** — admins can tune every filter through an in-chat menu
- **grammY framework** — built on the modern, type-safe Telegram bot framework ([grammy.dev](https://grammy.dev))

## Project Structure

The project is organized into **three services** and **shared infrastructure**:

```
src/
├── bot/              # Grammy Telegram bot service
│   ├── index.ts      # Bot entry point
│   ├── bot.ts        # Bot assembly & middleware chain
│   ├── bot-server.ts # Bot health/admin REST API
│   ├── commands/     # Telegram command handlers (public/ & private/)
│   ├── composers/    # Grammy composers for features & message filters
│   ├── middleware/    # Request processing middleware (parsing, guards, state)
│   ├── filters/      # Boolean filter functions for conditional logic
│   ├── handlers/     # Message & spam processing handlers
│   ├── plugins/      # Custom Grammy plugins (self-destruct, auto-reply)
│   ├── transformers/  # Grammy API call transformers
│   ├── session-providers/ # Redis session storage
│   ├── queries/      # Telegram callback query handlers
│   ├── listeners/    # Event listeners (speech-to-text, tensor training)
│   ├── menus/        # Grammy Menu definitions
│   └── messages/     # Bot response message templates
│
├── server/           # ML API Express server (standalone)
│   ├── index.ts      # Server entry point
│   ├── api.router.ts # REST API routes
│   └── middleware/    # Express middleware
│
├── userbot/          # MTProto userbot for research
│
├── services/         # Shared business logic services
├── tensor/           # TensorFlow.js ML models (spam, swindler, NSFW)
├── dataset/          # Dataset library (imported by app code)
│   ├── dataset.ts    # Main dataset loader
│   └── strings/      # JSON data files
│
├── shared/           # Shared infrastructure
│   ├── config.ts     # Environment configuration
│   ├── db/           # Redis client
│   ├── types/        # TypeScript type definitions
│   ├── const/        # Application constants
│   ├── utils/        # Utility functions
│   └── video/        # Video processing service
│
├── testing/          # Test utilities and mocks
├── locales/          # i18n translation files
└── assets/           # Static assets

dataset/              # Dataset CLI scripts (standalone tools)
│   └── scripts/      # check-swindlers, download, optimize scripts
scripts/              # Developer tooling scripts
tests/                # Vitest test suite (mirrors src/ structure)
```

## Table of Content

- [Before you start](#before-you-start)
  - [1. Files](#1-files)
  - [2. GitHub Access](#2-github-access)
- [Installation](#installation)
  - [1. Cloning](#1-cloning)
  - [2. Installing `Node.js`](#2-installing-nodejs)
    - [NVM (recommended)](#nvm-recommended)
    - [Node](#node)
  - [3. Installing Redis](#3-installing-redis)
    - [Docker-compose (recommended)](#docker-compose-recommended)
    - [Install in System](#install-in-system)
  - [4. Installing `node_modules`](#4-installing-node_modules)
  - [5. Copy `.env` file](#5-copy-env-file)
  - [6. Create your bot](#6-create-your-bot)
  - [7. Set your Telegram ID](#7-set-your-telegram-id)
  - [8. Set local testing `.env` variables](#8-set-local-testing-env-variables)
  - [9. Set Google Credits (confidential)](#9-set-google-credits-confidential)
  - [10. Set Alarm Credits (confidential)](#10-set-alarm-credits-confidential)
  - [11. Copy tensor files](#11-copy-tensor-files)
- [For external users](#for-external-users)
  - [1. Disable Google API](#1-disable-google-API)
  - [2. Disable Alarm API](#2-disable-alarm-API)
- [Running your bot](#running-your-bot)
  - [Enable bot in `Telegram`](#enable-bot-in-telegram)
  - [Docker](#docker)
- [Code Style](#code-style)
  - [Branch names](#branch-names)
  - [Commit names](#commit-names)
  - [Code Rules](#code-rules)
  - [IDE Setup](#ide-setup)
- [Credits](#credits)

## Before you start

If you from [Master of Code Global](https://masterofcode.com/) (MOC), PM me for next things:

### 1. Files

```
ua-anti-spam-bot-ml-v3.zip
.env.new
```

### 2. Github Access

You need to be added into `UA Anti Spam Bot Developers` team.

## Installation

### 1. Cloning

```bash
git clone git@github.com:MoC-OSS/ua-anti-spam-bot.git
cd ua-anti-spam-bot
```

### 2. Installing `Node.js`

#### NVM (recommended)

If you have Linux or MacOS, it's better to use [nvm](https://github.com/nvm-sh/nvm). We have `.nvmrc` file which includes the current version of node that we use on the project. Just run the following command at the root of the folder:

```bash
nvm use
```

#### Node

If you have Windows or want to install Node into the system, find the download Node.js version specified in `.nvmrc`.

### 3. Installing Redis

#### Docker-compose (recommended)

If you have `docker` and `docker-compose`, just run the following command:

```bash
docker-compose up -d redis
```

#### Install in System

If you don't want to use `docker-compose`, you can [install redis in system](https://redis.io/).

### 4. Installing `node_modules`

```bash
npm i
```

### 5. Copy `.env` file

Copy `.env.template` file to `.env`:

```bash
cp .env.template .env
```

### 6. Create your bot

Now you need to get `BOT_TOKEN` from [@BotFather](https://t.me/BotFather). You may find instruction here: https://core.telegram.org/bots/tutorial#obtain-your-bot-token

Set it into `.env` file:

```bash
BOT_TOKEN=4839574812:AAFD39kkdpWt3ywyRZergyOLMaJhac60qc
```

### 7. Set your Telegram ID

You can ask [@RawDataBot](https://t.me/RawDataBot) to get your ID. Simply write `/start` and find `message.from.id`. E.g, it will be `999999999`.

Set it into `.env` file:

```bash
CREATOR_ID=999999999
```

### 8. Set local testing `.env` variables

We recommend to set the following variables in your .env file like this:

```bash
ENV=local
USE_SERVER=false
DISABLE_LOGS_CHAT=true
```

### 9. Set Google Credits (confidential)

You need to obtain your own credits (or ask me if you from MOC team) and set them here:

```
GOOGLE_CREDITS=
GOOGLE_SPREADSHEET_ID=
```

### 10. Set Alarm Credits (confidential)

We use https://alerts.com.ua/ to obtain air raid alarms. You need to ask for a key from the API developer (or me if you from MOC).

```
ALARM_KEY=
```

### 11. Copy tensor files

Extract and copy `ua-anti-spam-bot-ml-v3.zip` to `src/tensor/temp`.

## For external users

If you are an external user, you need to set the following parameters for the following fields in `.env`

### 1. Disable Google API

If you don't have `GOOGLE_CREDITS` and `GOOGLE_SPREADSHEET_ID`, you need to specify the value like this:

```bash
DISABLE_GOOGLE_API=true
```

### 2. Disable Alarm API

If you don't have `ALARM_KEY`, you need to specify the value like this:

````bash
DISABLE_ALARM_API=true

If you're outside the MOC organization, use the copy-swindlers.sh script to copy models from `./src/tensor/swindlers-temp` into the `./src/tensor/temp` destination:

```bash
./copy-swindlers.sh
````

## Running your bot

To start your bot, simply run the following command:

```bash
npm run start:bot
```

### Enable bot in `Telegram`

After it, navigate to your bot and call `/start` command. If you receive the answer, your bot is working.

Then, try to call `/enable` command. If you receive the answer, your bot is set correctly and ready to be used.

### Test moderation as an admin

If you are a group administrator and want to test moderation without a second Telegram account, use the `/role` command directly in that group:

```text
/role
```

This toggles a per-chat test mode for your account only, so the bot will moderate your messages as if you were a regular user. To restore the normal behavior for administrators, run the same command again:

```text
/role
```

Note: this does not change your real Telegram permissions. Anonymous admins must temporarily disable anonymity before using `/role`, otherwise Telegram sends the command as `GroupAnonymousBot`.

### Docker

If you want to run the bot via Docker, make sure that you have [Docker](https://docs.docker.com/engine/install) and [Docker Compose](https://docs.docker.com/compose/install) installed.
Then, run the following command to start the bot in Docker:

```bash
docker-compose up --build
```

## Code Style

### Branch names

We use `branch-name-lint`.
To push a branch, be sure you have right prefix, ticket name in uppercase, and description split by underscore. Example branch name:

- feature/UABOT-8_create_lp_ui_elements
- hotfix/UABOT-11_add_missing_login_routes

Read more: https://github.com/barzik/branch-name-lint

### Commit names

We use Conversational Commits Conversational with `commitlint`.
To make a commit, be sure you follow it. Example:

- feat(UABOT-20): add the users page
- refactor(UABOT-10): refactor tests

Read more: https://www.conventionalcommits.org

### Code Rules

We have a pretty heavy `eslint` and `prettier` setup, so you don't need to be worried about code style. Tools will make everything for you.

### IDE Setup

Don't forget to setup your IDE:

1. **WebStorm:** Enable `eslint` plugin in this repo;
2. **VSCode:** Download and enable `eslint` plugin in this repo.

## Credits

Made with ❤️ to save Ukraine 🇺🇦 2023
