# IRSB Solver

Reference solver/executor service for the IRSB protocol.

## What is IRSB Solver?

IRSB Solver is the actor implementation that:
- Consumes intents from the IRSB protocol
- Runs allowed workflows off-chain
- Produces evidence of execution
- Submits receipts for settlement

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

MIT
