/**
 * Agent Passkey Client for IRSB Solver
 *
 * HTTP client for the irsb-agent-passkey signing service.
 * Handles SUBMIT_RECEIPT actions for the solver.
 *
 * Environment variables:
 * - AGENT_PASSKEY_ENDPOINT: Service URL (default: production Cloud Run)
 * - AGENT_PASSKEY_AUTH_TOKEN: Authentication token
 * - AGENT_PASSKEY_TIMEOUT_MS: Request timeout (default: 30000)
 */

/** Ethereum hex string (0x-prefixed) */
type Hex = `0x${string}`;

/**
 * Agent Passkey client configuration
 */
export interface AgentPasskeyClientConfig {
  /** Agent Passkey service endpoint */
  endpoint: string;

  /** Authentication token for the service */
  authToken?: string;

  /** Timeout in milliseconds (default: 30000) */
  timeoutMs?: number;
}

/**
 * Response from agent-passkey service
 */
export interface SigningResponse {
  /** Whether the request was successful */
  success: boolean;

  /** Signed transaction (if success) */
  signedTx?: {
    rawTransaction: Hex;
    hash: Hex;
  };

  /** Transaction hash if broadcast by service */
  txHash?: Hex;

  /** Signer address */
  signerAddress?: Hex;

  /** Audit artifact ID */
  auditId?: string;

  /** Error message (if failed) */
  error?: string;

  /** Policy denial reasons (if denied) */
  denyReasons?: string[];
}

/**
 * Submit receipt request parameters
 */
export interface SubmitReceiptParams {
  /** Intent ID (bytes32) */
  intentId: string;

  /** Receipt hash (keccak256 of receipt data) */
  receiptHash: string;

  /** Evidence hash (keccak256 of evidence bundle manifest) */
  evidenceHash: string;

  /** Chain ID to submit on */
  chainId: number;

  /** Idempotency key (optional, prevents double-signing) */
  idempotencyKey?: string;
}

/**
 * Agent Passkey Client
 *
 * @example
 * ```typescript
 * const client = new AgentPasskeyClient({
 *   endpoint: process.env.AGENT_PASSKEY_ENDPOINT,
 *   authToken: process.env.AGENT_PASSKEY_AUTH_TOKEN,
 * });
 *
 * const result = await client.submitReceipt({
 *   intentId: '0x...',
 *   receiptHash: '0x...',
 *   evidenceHash: '0x...',
 *   chainId: 11155111, // Sepolia
 * });
 *
 * if (result.success) {
 *   console.log('Receipt submitted:', result.txHash);
 * }
 * ```
 */
export class AgentPasskeyClient {
  private config: Required<AgentPasskeyClientConfig>;

  constructor(config: AgentPasskeyClientConfig) {
    this.config = {
      endpoint: config.endpoint,
      authToken: config.authToken ?? '',
      timeoutMs: config.timeoutMs ?? 30000,
    };
  }

  /**
   * Submit a receipt to the IRSB protocol
   */
  async submitReceipt(params: SubmitReceiptParams): Promise<SigningResponse> {
    return this.callService('/sign', {
      action: 'SUBMIT_RECEIPT',
      chainId: params.chainId,
      payload: {
        intentId: params.intentId,
        receiptHash: params.receiptHash,
        evidenceHash: params.evidenceHash,
      },
      idempotencyKey: params.idempotencyKey,
    });
  }

  /**
   * Check if the agent-passkey service is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      const data = (await response.json()) as { status?: string };
      return data.status === 'ok';
    } catch {
      return false;
    }
  }

  /**
   * Get the signer address from the service
   */
  async getSignerAddress(): Promise<Hex | null> {
    try {
      const response = await fetch(`${this.config.endpoint}/info`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000),
      });
      const data = (await response.json()) as { signerAddress?: Hex };
      return data.signerAddress ?? null;
    } catch {
      return null;
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Role': 'solver',
    };

    if (this.config.authToken) {
      headers['Authorization'] = `Bearer ${this.config.authToken}`;
    }

    return headers;
  }

  private async callService(
    path: string,
    body: Record<string, unknown>
  ): Promise<SigningResponse> {
    const response = await fetch(`${this.config.endpoint}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Agent-passkey request failed: ${response.status} ${error}`,
      };
    }

    return response.json() as Promise<SigningResponse>;
  }
}

/**
 * Create an Agent Passkey client from environment variables
 *
 * Environment variables:
 * - AGENT_PASSKEY_ENDPOINT (default: production Cloud Run URL)
 * - AGENT_PASSKEY_AUTH_TOKEN
 * - AGENT_PASSKEY_TIMEOUT_MS (default: 30000)
 */
export function createAgentPasskeyClientFromEnv(): AgentPasskeyClient {
  const authToken = process.env['AGENT_PASSKEY_AUTH_TOKEN'];
  return new AgentPasskeyClient({
    endpoint:
      process.env['AGENT_PASSKEY_ENDPOINT'] ??
      'https://irsb-agent-passkey-308207955734.us-central1.run.app',
    ...(authToken ? { authToken } : {}),
    timeoutMs: parseInt(process.env['AGENT_PASSKEY_TIMEOUT_MS'] ?? '30000', 10),
  });
}
