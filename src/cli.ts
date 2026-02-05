#!/usr/bin/env node
/**
 * IRSB Solver CLI
 *
 * Commands:
 * - check-config: Validate configuration
 * - print-intent <path>: Print normalized intent with intentId
 * - run-fixture <path>: Validate, policy gate, print execution plan
 */

import { Command } from "commander";
import { readFileSync } from "node:fs";
import { loadConfig, configSummary, type ResolvedConfig } from "./config.js";
import { normalizeIntent, computeIntentId } from "./intent/normalize.js";
import { evaluatePolicy, createRefusalRecord } from "./policy/policy.js";
import { createExecutionPlan, formatExecutionPlan } from "./plan/plan.js";
import { appendJsonl } from "./storage/jsonl.js";
import type { NormalizedIntent } from "./types/intent.js";

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
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error(error);
      }
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
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error(error);
      }
      process.exit(1);
    }
  });

/**
 * run-fixture command
 */
program
  .command("run-fixture")
  .description("Validate intent, apply policy gate, print execution plan")
  .argument("<path>", "Path to intent JSON file")
  .action((path: string) => {
    let config: ResolvedConfig;
    let normalized: NormalizedIntent;

    // Load config
    try {
      config = loadConfig();
    } catch (error) {
      console.error("Configuration error:");
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error(error);
      }
      process.exit(1);
    }

    // Load and normalize intent
    try {
      const json = readFileSync(path, "utf8");
      const parsed = JSON.parse(json) as unknown;
      normalized = normalizeIntent(parsed);
    } catch (error) {
      console.error("Error processing intent:");
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error(error);
      }
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
        if (error instanceof Error) {
          console.error(error.message);
        }
      }

      process.exit(2); // Exit code 2 for policy refusal
    }

    console.log("Intent approved. Ready for execution (Phase 3).");
    process.exit(0);
  });

// Parse and run
program.parse();
