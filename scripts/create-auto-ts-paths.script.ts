/* eslint-disable no-await-in-loop,import/no-extraneous-dependencies,no-use-before-define,no-continue,security/detect-non-literal-fs-filename */
import * as fs from 'node:fs/promises';
import path from 'node:path';

import type { CompilerOptions } from 'typescript';
import * as ts from 'typescript';

import { logger } from '@utils/logger.util';

const DEFAULT_TSCONFIG_NAME = 'tsconfig.json';
const SRC_DIR_NAME = 'src';
const ALIAS_PREFIX = '@';

/**
 * Entry point.
 */
async function main() {
  const currentWorkingDirectory = process.cwd();
  const tsconfigArgument = process.argv[2];

  const tsconfigPath = tsconfigArgument
    ? path.resolve(currentWorkingDirectory, tsconfigArgument)
    : await findUp(DEFAULT_TSCONFIG_NAME, currentWorkingDirectory);

  if (!tsconfigPath) {
    throw new Error(
      `Cannot find ${DEFAULT_TSCONFIG_NAME}. Run from a project folder or pass a path: ts-node scripts/generate-paths.ts ../tsconfig.json`,
    );
  }

  const tsconfigDirectory = path.dirname(tsconfigPath);
  const sourceDirectoryAbs = path.resolve(tsconfigDirectory, SRC_DIR_NAME);

  const hasSource = await pathExists(sourceDirectoryAbs);

  if (!hasSource) {
    throw new Error(`Cannot find "${SRC_DIR_NAME}" folder at: ${sourceDirectoryAbs}`);
  }

  const sourceFolders = await readImmediateSubdirs(sourceDirectoryAbs);

  if (sourceFolders.length === 0) {
    logger.info(`No subfolders found in ${sourceDirectoryAbs}. Nothing to add.`);

    return;
  }

  const originalText = await fs.readFile(tsconfigPath, 'utf8');
  const parsed = ts.parseConfigFileTextToJson(tsconfigPath, originalText);

  if (parsed.error) {
    throw new Error(formatTsDiagnostic(parsed.error));
  }

  const config = (parsed.config as ts.server.ProjectInfoTelemetryEventData) ?? {};
  const compilerOptions = ensurePlainObject(config, 'compilerOptions') as CompilerOptions;
  const paths = (ensurePlainObject(compilerOptions, 'paths') || {}) as Record<string, string[]>;

  const baseUrl = typeof compilerOptions.baseUrl === 'string' ? compilerOptions.baseUrl : null;
  const baseForPathsAbs = baseUrl ? path.resolve(tsconfigDirectory, baseUrl) : tsconfigDirectory;

  const added: string[] = [];

  // Keep existing order, append new keys in a stable order.
  for (const directoryName of sourceFolders.toSorted((firstFolder, secondFolder) => firstFolder.localeCompare(secondFolder))) {
    const aliasKey = `${ALIAS_PREFIX}${directoryName}/*`;

    if (Object.prototype.hasOwnProperty.call(paths, aliasKey)) {
      continue;
    }

    const folderAbs = path.join(sourceDirectoryAbs, directoryName);
    const relativeDirectory = path.relative(baseForPathsAbs, folderAbs);
    const relativePosixDirectory = toPosixPath(relativeDirectory);

    let target = `${relativePosixDirectory}/*`;

    if (!baseUrl) {
      target = ensureDotPrefix(target);
    }

    // aliasKey is derived from validated folder names under src/
    // eslint-disable-next-line security/detect-object-injection
    paths[aliasKey] = [target];
    added.push(aliasKey);
  }

  if (added.length === 0) {
    logger.info('No new aliases to add. tsconfig.json unchanged.');

    return;
  }

  const nextText = `${JSON.stringify(config, null, 2)}\n`;

  await fs.writeFile(tsconfigPath, nextText, 'utf8');

  logger.info(`Added ${added.length} alias(es) to compilerOptions.paths:`);

  for (const newPath of added) {
    logger.info(`  - ${newPath}`);
  }
}

/**
 * Returns true if a path exists (file or directory).
 * @param filePath - Path to check.
 */
async function pathExists(filePath: string) {
  try {
    await fs.access(filePath);

    return true;
  } catch {
    return false;
  }
}

/**
 * Finds a file by walking up from a start directory.
 * @param fileName - Name to look for (e.g. tsconfig.json).
 * @param startDirectory - Directory to start from.
 */
async function findUp(fileName: string, startDirectory: string) {
  let directory = path.resolve(startDirectory);

  while (true) {
    const candidate = path.join(directory, fileName);

    if (await pathExists(candidate)) {
      return candidate;
    }

    const parent = path.dirname(directory);

    if (parent === directory) {
      return null;
    } // reached filesystem root

    directory = parent;
  }
}

/**
 * Reads only the immediate subdirectories of a directory.
 * @param directoryAbs - Absolute directory path.
 */
async function readImmediateSubdirs(directoryAbs: string) {
  const entries = await fs.readdir(directoryAbs, { withFileTypes: true });

  return entries
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .filter((name) => name !== '.' && name !== '..');
}

/**
 * Ensures an object property is a plain object; otherwise sets it to {}.
 * @param container - The object to mutate.
 * @param key - Property name.
 */
function ensurePlainObject<T>(container: T, key: keyof T) {
  // key is constrained by the caller and only used against known config objects
  // eslint-disable-next-line security/detect-object-injection
  const value = container?.[key];

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }

  // Create missing or invalid shape.
  // eslint-disable-next-line no-param-reassign,security/detect-object-injection
  container[key] = {} as T[keyof T];

  // eslint-disable-next-line security/detect-object-injection
  return container[key];
}

/**
 * Converts Windows backslashes to POSIX slashes for tsconfig paths.
 * @param originalPath - Path to normalize.
 */
function toPosixPath(originalPath: string) {
  return String(originalPath).replaceAll('\\', '/');
}

/**
 * Adds "./" prefix when a relative path doesn't already start with "." or "/".
 * @param relativePath - Relative path (POSIX).
 */
function ensureDotPrefix(relativePath: string) {
  const normalizedPath = String(relativePath);

  if (normalizedPath.startsWith('.') || normalizedPath.startsWith('/')) {
    return normalizedPath;
  }

  return `./${normalizedPath}`;
}

/**
 * Formats a TypeScript diagnostic into a readable string.
 * @param diagnostic - TS diagnostic object.
 */
function formatTsDiagnostic(diagnostic: ts.Diagnostic) {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
  const file = diagnostic.file?.fileName ? ` (${diagnostic.file.fileName})` : '';

  return `Failed to parse tsconfig.json${file}: ${message}`;
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);

  logger.error(message);
  process.exitCode = 1;
});
