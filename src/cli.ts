#!/usr/bin/env node
/**
 * IRSB Solver CLI
 *
 * Commands:
 * - check-config: Validate configuration
 * - print-intent <path>: Print normalized intent with intentId
 * - run-fixture <path>: Validate, policy gate, execute, print result
 * - make-evidence <runDir>: Create evidence bundle for a run
 * - validate-evidence <path>: Validate evidence bundle integrity
 */

import { Command } from "commander";
import { join } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { ZodError } from "zod";
import { loadConfig, configSummary, type ResolvedConfig } from "./config.js";
import { normalizeIntent, computeIntentId } from "./intent/normalize.js";
import { evaluatePolicy, createRefusalRecord } from "./policy/policy.js";
import { createExecutionPlan, formatExecutionPlan } from "./plan/plan.js";
import { appendJsonl } from "./storage/jsonl.js";
import { createRunContext } from "./execution/runContext.js";
import { getRunner } from "./execution/registry.js";
import { canonicalJson } from "./utils/canonicalJson.js";
import {
  createEvidenceBundle,
  validateEvidenceBundle,
  validateManifestFile,
  readManifest,
} from "./evidence/index.js";
import type { NormalizedIntent } from "./types/intent.js";
import type { RunResult } from "./execution/jobRunner.js";

/**
 * Formats an error for CLI output.
 * Provides detailed output for ZodError validation failures.
 */
function formatError(error: unknown): string {
  if (error instanceof ZodError) {
    const issues = error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      return `  - ${path}: ${issue.message}`;
    });
    return `Validation failed:\n${issues.join("\n")}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

/**
 * Formats a run result for stable output (no timestamps).
 */
function formatRunResult(result: RunResult): string {
  // Use canonical JSON for stable output
  return canonicalJson(result);
}

const program = new Command();

program
  .name("irsb-solver")
  .description("Reference solver/executor for IRSB protocol")
  .version("0.1.0");

/**
 * check-config command
 */
program
  .command("check-config")
  .description("Validate configuration and print summary")
  .action(() => {
    try {
      const config = loadConfig();
      console.log("Configuration valid.\n");
      console.log(JSON.stringify(configSummary(config), null, 2));
      process.exit(0);
    } catch (error) {
      console.error("Configuration error:");
      console.error(formatError(error));
      process.exit(1);
    }
  });

/**
 * print-intent command
 */
program
  .command("print-intent")
  .description("Print normalized intent with computed intentId")
  .argument("<path>", "Path to intent JSON file")
  .action((path: string) => {
    try {
      const json = readFileSync(path, "utf8");
      const parsed = JSON.parse(json) as unknown;
      const normalized = normalizeIntent(parsed);

      console.log("Normalized Intent:");
      console.log(JSON.stringify(normalized, null, 2));
      console.log(`\nintentId: ${normalized.intentId}`);

      // Also show the computed ID to verify determinism
      const computedId = computeIntentId(normalized);
      if (normalized.intentId !== computedId) {
        console.log(`\nNote: Provided intentId differs from computed:`);
        console.log(`  provided: ${normalized.intentId}`);
        console.log(`  computed: ${computedId}`);
      }

      process.exit(0);
    } catch (error) {
      console.error("Error processing intent:");
      console.error(formatError(error));
      process.exit(1);
    }
  });

/**
 * run-fixture command
 */
program
  .command("run-fixture")
  .description("Validate intent, apply policy gate, execute job, print result")
  .argument("<path>", "Path to intent JSON file")
  .option("--dry-run", "Skip execution, only show plan")
  .action(async (path: string, options: { dryRun?: boolean }) => {
    let config: ResolvedConfig;
    let normalized: NormalizedIntent;

    // Load config
    try {
      config = loadConfig();
    } catch (error) {
      console.error("Configuration error:");
      console.error(formatError(error));
      process.exit(1);
    }

    // Load and normalize intent
    try {
      const json = readFileSync(path, "utf8");
      const parsed = JSON.parse(json) as unknown;
      normalized = normalizeIntent(parsed);
    } catch (error) {
      console.error("Error processing intent:");
      console.error(formatError(error));
      process.exit(1);
    }

    // Evaluate policy
    const policyResult = evaluatePolicy(normalized, config);

    // Create execution plan
    const plan = createExecutionPlan(normalized, config, policyResult);

    // Print plan
    console.log(formatExecutionPlan(plan));
    console.log("");

    // If refused, write refusal record
    if (!policyResult.allowed) {
      const refusalRecord = createRefusalRecord(
        normalized,
        plan.runId,
        policyResult.reasons
      );

      try {
        appendJsonl(config.REFUSALS_PATH, refusalRecord);
        console.log(`Refusal recorded to: ${config.REFUSALS_PATH}`);
      } catch (error) {
        console.error("Error writing refusal record:");
        console.error(formatError(error));
      }

      process.exit(2); // Exit code 2 for policy refusal
    }

    // Dry run mode - stop here
    if (options.dryRun) {
      console.log("Dry run mode - skipping execution.");
      process.exit(0);
    }

    // Execute the job
    console.log("Executing job...");
    console.log("");

    try {
      // Create run context
      const ctx = createRunContext({
        intentId: normalized.intentId,
        runId: plan.runId,
        jobType: normalized.jobType,
        dataDir: config.DATA_DIR,
        requester: normalized.requester,
      });

      // Get the runner
      const runner = getRunner(normalized.jobType);

      // Execute
      const result = await runner.run(normalized.inputs, ctx);

      // Print result (stable JSON output)
      console.log("Run Result:");
      console.log(formatRunResult(result));
      console.log("");

      if (result.status === "SUCCESS") {
        console.log(`Artifacts written to: ${ctx.artifactsDir}`);
        for (const artifact of result.artifacts) {
          console.log(`  - ${artifact.path} (${String(artifact.bytes)} bytes)`);
        }

        // Create evidence bundle
        console.log("");
        console.log("Creating evidence bundle...");
        const runDir = join(config.DATA_DIR, "runs", plan.runId);
        const evidenceResult = createEvidenceBundle({
          runDir,
          intentId: normalized.intentId,
          runId: plan.runId,
          jobType: normalized.jobType,
          policyDecision: {
            allowed: policyResult.allowed,
            reasons: policyResult.reasons,
          },
          executionSummary: {
            status: result.status,
          },
        });

        console.log(`Evidence manifest: ${evidenceResult.manifestPath}`);
        console.log(`manifestSha256: ${evidenceResult.manifestSha256}`);
        process.exit(0);
      } else {
        console.error(`Execution failed: ${result.error ?? "Unknown error"}`);
        process.exit(3); // Exit code 3 for execution failure
      }
    } catch (error) {
      console.error("Execution error:");
      console.error(formatError(error));
      process.exit(3);
    }
  });

/**
 * make-evidence command
 */
program
  .command("make-evidence")
  .description("Create evidence bundle for an existing run")
  .argument("<runDir>", "Path to run directory")
  .action((runDir: string) => {
    try {
      // Read manifest info from existing manifest if present, or infer from path
      const manifestPath = join(runDir, "evidence", "manifest.json");
      let intentId = "unknown";
      let runId = "unknown";
      let jobType = "unknown";

      // Try to extract runId from path
      const pathParts = runDir.split("/");
      const runsIdx = pathParts.lastIndexOf("runs");
      if (runsIdx !== -1 && runsIdx < pathParts.length - 1) {
        const extractedRunId = pathParts[runsIdx + 1];
        if (extractedRunId) {
          runId = extractedRunId;
        }
      }

      // If manifest exists, read metadata from it
      if (existsSync(manifestPath)) {
        const existing = readManifest(manifestPath);
        intentId = existing.intentId;
        runId = existing.runId;
        jobType = existing.jobType;
      }

      const result = createEvidenceBundle({
        runDir,
        intentId,
        runId,
        jobType,
        policyDecision: { allowed: true, reasons: [] },
        executionSummary: { status: "SUCCESS" },
      });

      console.log("Evidence bundle created.");
      console.log(`  Manifest: ${result.manifestPath}`);
      console.log(`  manifestSha256: ${result.manifestSha256}`);
      console.log("");
      console.log("Artifacts:");
      for (const artifact of result.manifest.artifacts) {
        console.log(`  - ${artifact.path} (${String(artifact.bytes)} bytes)`);
      }
      process.exit(0);
    } catch (error) {
      console.error("Error creating evidence bundle:");
      console.error(formatError(error));
      process.exit(1);
    }
  });

/**
 * validate-evidence command
 */
program
  .command("validate-evidence")
  .description("Validate evidence bundle integrity")
  .argument("<path>", "Path to run directory or manifest file")
  .action((path: string) => {
    try {
      // Determine if path is a run directory or manifest file
      const isManifestFile = path.endsWith("manifest.json");
      const result = isManifestFile
        ? validateManifestFile(path)
        : validateEvidenceBundle(path);

      if (result.valid) {
        console.log("Evidence bundle valid.");
        if (result.manifest) {
          console.log(`  intentId: ${result.manifest.intentId}`);
          console.log(`  runId: ${result.manifest.runId}`);
          console.log(`  jobType: ${result.manifest.jobType}`);
          console.log(`  artifacts: ${String(result.manifest.artifacts.length)}`);
        }
        process.exit(0);
      } else {
        console.error("Evidence bundle validation failed:");
        for (const error of result.errors) {
          const pathInfo = error.path ? ` [${error.path}]` : "";
          console.error(`  - [${error.code}]${pathInfo}: ${error.message}`);
        }
        process.exit(1);
      }
    } catch (error) {
      console.error("Validation error:");
      console.error(formatError(error));
      process.exit(1);
    }
  });

// Parse and run
program.parse();
