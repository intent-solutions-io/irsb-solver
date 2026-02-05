/**
 * IRSB Solver - Reference solver/executor for IRSB protocol
 *
 * This module exports the main components for programmatic use.
 * For CLI usage, see src/cli.ts.
 */

export const VERSION = "0.1.0";

// Config
export { loadConfig, configSummary, type ResolvedConfig } from "./config.js";

// Types
export {
  type IntentV0,
  type NormalizedIntent,
  type JobType,
  type Inputs,
  type SafeReportInputs,
  INTENT_VERSION,
  IntentV0Schema,
  JobTypeSchema,
  parseIntent,
  isIntentV0,
} from "./types/intent.js";

// Intent normalization
export {
  normalizeIntent,
  normalizeIntentFromJson,
  computeIntentId,
} from "./intent/normalize.js";

// Policy
export {
  evaluatePolicy,
  createRefusalRecord,
  type PolicyResult,
  type RefusalRecord,
} from "./policy/policy.js";

// Execution plan
export {
  createExecutionPlan,
  computeRunId,
  formatExecutionPlan,
  type ExecutionPlan,
} from "./plan/plan.js";

// Storage
export { appendJsonl, appendJsonlFast, readJsonl } from "./storage/jsonl.js";

// Utilities
export { canonicalJson, parseAndCanonicalize } from "./utils/canonicalJson.js";
export { sha256, sha256WithPrefix } from "./utils/hash.js";
