/**
 * Append-only JSONL writer with atomic write behavior.
 *
 * Uses write-to-temp-then-rename pattern for atomic appends.
 */

import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";

/**
 * Ensures the parent directory exists.
 */
function ensureDir(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Generates a unique temporary filename in the same directory.
 */
function tempPath(filePath: string): string {
  const dir = dirname(filePath);
  const suffix = randomBytes(8).toString("hex");
  return join(dir, `.tmp-${suffix}.jsonl`);
}

/**
 * Appends a record to a JSONL file atomically.
 *
 * Process:
 * 1. Read existing content (if file exists)
 * 2. Write existing + new record to temp file
 * 3. Rename temp file to target (atomic on POSIX)
 *
 * This ensures partial writes don't corrupt the file.
 */
export function appendJsonl(filePath: string, record: unknown): void {
  ensureDir(filePath);

  const line = JSON.stringify(record) + "\n";

  if (existsSync(filePath)) {
    // Append atomically: read, write temp, rename
    const existing = readFileSync(filePath, "utf8");
    const temp = tempPath(filePath);
    writeFileSync(temp, existing + line, "utf8");
    renameSync(temp, filePath);
  } else {
    // First record: just write
    writeFileSync(filePath, line, "utf8");
  }
}

/**
 * Non-atomic append for high-frequency writes.
 * Use when atomicity is not critical.
 */
export function appendJsonlFast(filePath: string, record: unknown): void {
  ensureDir(filePath);
  const line = JSON.stringify(record) + "\n";
  appendFileSync(filePath, line, "utf8");
}

/**
 * Reads all records from a JSONL file.
 * Returns empty array if file doesn't exist.
 */
export function readJsonl<T>(filePath: string): T[] {
  if (!existsSync(filePath)) {
    return [];
  }

  const content = readFileSync(filePath, "utf8");
  const lines = content.trim().split("\n").filter(Boolean);
  return lines.map((line) => JSON.parse(line) as T);
}
