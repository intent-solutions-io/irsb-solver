# IRSB Solver

Reference solver/executor service for the IRSB protocol.

## What is IRSB Solver?

IRSB Solver is the actor implementation that:
- Consumes intents from the IRSB protocol
- Runs allowed workflows off-chain
- Produces evidence of execution
- Submits receipts for settlement

## Determinism Pledge

This solver is designed for **reproducible, auditable execution**:

- **Deterministic IDs**: All identifiers (`runId`, `receiptId`) are computed from canonical inputs, not random UUIDs
- **Canonical Hashing**: JSON is sorted by keys, no floats in hashed content, no wall-clock timestamps in artifacts
- **Reproducible Evidence**: Given the same intent and inputs, the solver produces identical evidence hashes
- **Idempotent Retries**: Re-running the same intent produces the same receipt (no duplicate work)

This enables:
- Third-party verification of execution correctness
- Watchtower correlation of receipts to intents
- Dispute resolution based on reproducible evidence

## What This Repo Does NOT Do

**Out of Scope:**

| Not Here | Where It Belongs |
|----------|------------------|
| On-chain contracts | [irsb-protocol](https://github.com/intent-solutions-io/irsb-protocol) |
| Monitoring/alerting | [irsb-watchtower](https://github.com/intent-solutions-io/irsb-watchtower) |
| LLM/AI agent orchestration | Not part of IRSB (ERC-8004 discovery shapes only) |
| Multi-solver coordination | Future scope |
| Chain-native execution | Solvers execute off-chain, post receipts on-chain |

## Related Repositories

| Repo | Purpose |
|------|---------|
| [irsb-protocol](https://github.com/intent-solutions-io/irsb-protocol) | On-chain contracts, schemas, settlement primitives |
| [irsb-watchtower](https://github.com/intent-solutions-io/irsb-watchtower) | Indexing, monitoring, alerts, dashboards |
| **irsb-solver** (this repo) | Reference solver/executor service |

## Current Status

**Phase 1: Scaffold** - Repository structure and tooling baseline.

## Next Phases

- Phase 2: Intent schema + config + CLI
- Phase 3: Evidence bundle + hashing
- Phase 4: Receipt builder + submitter
- Phase 5: Policy engine (allowlists, budgets, risk gates)
- Phase 6: Integration testing
- Phase 7: Observability (metrics, logging)
- Phase 8: Production hardening

## Local Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run tests
pnpm test

# Run linter
pnpm lint

# Build for production
pnpm build
```

## Requirements

- Node.js 20+
- pnpm 9+

## License

MIT License - See [LICENSE](./LICENSE) for details.

### Licensing Scope

This license applies to:
- All source code in this repository
- Documentation in `000-docs/`
- Configuration files and examples

This license does NOT cover:
- The IRSB protocol specification (separate ERC proposal)
- On-chain contracts (see [irsb-protocol](https://github.com/intent-solutions-io/irsb-protocol))
- Third-party dependencies (see their respective licenses)
