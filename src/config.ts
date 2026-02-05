/**
 * Configuration system with zod validation.
 *
 * Sources:
 * - Environment variables
 * - Optional JSON config file (IRSB_SOLVER_CONFIG_PATH)
 */

import { z } from "zod";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Environment enum
 */
export const NodeEnvSchema = z.enum(["development", "test", "production"]);
export type NodeEnv = z.infer<typeof NodeEnvSchema>;

/**
 * Log level enum
 */
export const LogLevelSchema = z.enum([
  "trace",
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
]);
export type LogLevel = z.infer<typeof LogLevelSchema>;

/**
 * Configuration schema
 */
export const ConfigSchema = z.object({
  // Environment
  NODE_ENV: NodeEnvSchema.default("development"),
  LOG_LEVEL: LogLevelSchema.default("info"),

  // Data directories
  DATA_DIR: z.string().default("./data"),

  // Intent fixtures (for testing/demo)
  INTENT_FIXTURE_PATH: z.string().optional(),

  // Policy settings
  POLICY_JOBTYPE_ALLOWLIST: z
    .string()
    .default("SAFE_REPORT")
    .transform((s) => s.split(",").map((x) => x.trim())),
  POLICY_MAX_ARTIFACT_MB: z.coerce.number().positive().default(5),
  POLICY_REQUESTER_ALLOWLIST: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(",").map((x) => x.trim()) : undefined)),

  // Storage paths (computed from DATA_DIR if not set)
  RECEIPTS_PATH: z.string().optional(),
  REFUSALS_PATH: z.string().optional(),
  EVIDENCE_DIR: z.string().optional(),
});

/**
 * Resolved configuration type with computed paths
 */
export interface ResolvedConfig {
  NODE_ENV: NodeEnv;
  LOG_LEVEL: LogLevel;
  DATA_DIR: string;
  INTENT_FIXTURE_PATH?: string | undefined;
  POLICY_JOBTYPE_ALLOWLIST: string[];
  POLICY_MAX_ARTIFACT_MB: number;
  POLICY_REQUESTER_ALLOWLIST?: string[] | undefined;
  RECEIPTS_PATH: string;
  REFUSALS_PATH: string;
  EVIDENCE_DIR: string;
}

/**
 * Loads optional JSON config file.
 */
function loadConfigFile(path: string): Record<string, unknown> {
  if (!existsSync(path)) {
    throw new Error(`Config file not found: ${path}`);
  }
  const content = readFileSync(path, "utf8");
  return JSON.parse(content) as Record<string, unknown>;
}

/**
 * Loads and validates configuration from environment and optional file.
 * Throws ZodError if validation fails.
 */
export function loadConfig(): ResolvedConfig {
  // Start with environment variables
  let rawConfig: Record<string, unknown> = { ...process.env };

  // Optionally merge JSON config file
  const configPath = process.env.IRSB_SOLVER_CONFIG_PATH;
  if (configPath) {
    const fileConfig = loadConfigFile(configPath);
    rawConfig = { ...rawConfig, ...fileConfig };
  }

  // Parse and validate
  const parsed = ConfigSchema.parse(rawConfig);

  // Compute derived paths
  const dataDir = resolve(parsed.DATA_DIR);

  return {
    NODE_ENV: parsed.NODE_ENV,
    LOG_LEVEL: parsed.LOG_LEVEL,
    DATA_DIR: dataDir,
    INTENT_FIXTURE_PATH: parsed.INTENT_FIXTURE_PATH,
    POLICY_JOBTYPE_ALLOWLIST: parsed.POLICY_JOBTYPE_ALLOWLIST,
    POLICY_MAX_ARTIFACT_MB: parsed.POLICY_MAX_ARTIFACT_MB,
    POLICY_REQUESTER_ALLOWLIST: parsed.POLICY_REQUESTER_ALLOWLIST,
    RECEIPTS_PATH: parsed.RECEIPTS_PATH ?? resolve(dataDir, "receipts.jsonl"),
    REFUSALS_PATH: parsed.REFUSALS_PATH ?? resolve(dataDir, "refusals.jsonl"),
    EVIDENCE_DIR: parsed.EVIDENCE_DIR ?? resolve(dataDir, "evidence"),
  };
}

/**
 * Returns a sanitized config summary (no secrets).
 */
export function configSummary(config: ResolvedConfig): Record<string, unknown> {
  return {
    NODE_ENV: config.NODE_ENV,
    LOG_LEVEL: config.LOG_LEVEL,
    DATA_DIR: config.DATA_DIR,
    INTENT_FIXTURE_PATH: config.INTENT_FIXTURE_PATH ?? "(not set)",
    POLICY_JOBTYPE_ALLOWLIST: config.POLICY_JOBTYPE_ALLOWLIST,
    POLICY_MAX_ARTIFACT_MB: config.POLICY_MAX_ARTIFACT_MB,
    POLICY_REQUESTER_ALLOWLIST:
      config.POLICY_REQUESTER_ALLOWLIST ?? "(not set)",
    RECEIPTS_PATH: config.RECEIPTS_PATH,
    REFUSALS_PATH: config.REFUSALS_PATH,
    EVIDENCE_DIR: config.EVIDENCE_DIR,
  };
}
