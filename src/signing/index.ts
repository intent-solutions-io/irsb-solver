/**
 * Signing module for IRSB Solver
 *
 * Uses the centralized irsb-agent-passkey service for signing.
 * The solver submits SUBMIT_RECEIPT actions to the service.
 */

export {
  AgentPasskeyClient,
  createAgentPasskeyClientFromEnv,
  type AgentPasskeyClientConfig,
  type SigningResponse,
  type SubmitReceiptParams,
} from './client.js';
