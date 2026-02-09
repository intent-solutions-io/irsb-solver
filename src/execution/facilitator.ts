/**
 * X402Facilitator Client
 *
 * Client for interacting with the X402Facilitator contract
 * for settling payments (direct and delegated).
 *
 * Replaces the agent-passkey HTTP flow with direct contract calls
 * signed by Cloud KMS.
 */

/** Ethereum hex string (0x-prefixed) */
type Hex = `0x${string}`;

/**
 * X402Facilitator contract configuration
 */
export interface FacilitatorConfig {
  /** X402Facilitator contract address */
  facilitatorAddress: Hex;

  /** WalletDelegate contract address */
  walletDelegateAddress: Hex;

  /** RPC URL for the target chain */
  rpcUrl: string;

  /** Chain ID */
  chainId: number;
}

/**
 * Settlement parameters matching Solidity SettlementParams
 */
export interface SettlementParams {
  paymentHash: Hex;
  token: Hex;
  amount: bigint;
  seller: Hex;
  buyer: Hex;
  receiptId: Hex;
  intentHash: Hex;
  proof: Hex;
  expiry: bigint;
}

/**
 * Settlement result
 */
export interface SettlementResult {
  success: boolean;
  txHash?: Hex;
  error?: string;
}

/**
 * X402Facilitator Client
 *
 * @example
 * ```typescript
 * const facilitator = new FacilitatorClient({
 *   facilitatorAddress: '0x...',
 *   walletDelegateAddress: '0x...',
 *   rpcUrl: 'https://rpc.sepolia.org',
 *   chainId: 11155111,
 * });
 *
 * const result = await facilitator.settlePayment(params, signerFn);
 * ```
 */
export class FacilitatorClient {
  private config: FacilitatorConfig;

  constructor(config: FacilitatorConfig) {
    this.config = config;
  }

  /**
   * Settle a direct payment (buyer pays directly)
   *
   * @param params - Settlement parameters
   * @param signAndSend - Function to sign and broadcast the transaction
   */
  async settlePayment(
    params: SettlementParams,
    signAndSend: (txData: { to: Hex; data: Hex }) => Promise<Hex>,
  ): Promise<SettlementResult> {
    try {
      // Encode settlePayment(SettlementParams) calldata
      const data = encodeSettlePayment(params);

      const txHash = await signAndSend({
        to: this.config.facilitatorAddress,
        data,
      });

      return { success: true, txHash };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Settle a payment via delegation (buyer has active 7702 delegation)
   *
   * @param delegationHash - Hash of the active delegation
   * @param params - Settlement parameters
   * @param signAndSend - Function to sign and broadcast
   */
  async settleDelegated(
    delegationHash: Hex,
    params: SettlementParams,
    signAndSend: (txData: { to: Hex; data: Hex }) => Promise<Hex>,
  ): Promise<SettlementResult> {
    try {
      // Encode settleDelegated(bytes32, SettlementParams) calldata
      const data = encodeSettleDelegated(delegationHash, params);

      const txHash = await signAndSend({
        to: this.config.facilitatorAddress,
        data,
      });

      return { success: true, txHash };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Settle multiple payments in a batch
   *
   * @param paramsList - Array of settlement parameters
   * @param signAndSend - Function to sign and broadcast
   */
  async batchSettle(
    paramsList: SettlementParams[],
    signAndSend: (txData: { to: Hex; data: Hex }) => Promise<Hex>,
  ): Promise<SettlementResult> {
    try {
      const data = encodeBatchSettle(paramsList);

      const txHash = await signAndSend({
        to: this.config.facilitatorAddress,
        data,
      });

      return { success: true, txHash };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check if a payment has been settled
   */
  async isSettled(_paymentHash: Hex): Promise<boolean> {
    // TODO: Implement with viem readContract
    // const result = await publicClient.readContract({
    //   address: this.config.facilitatorAddress,
    //   abi: X402_FACILITATOR_ABI,
    //   functionName: 'isSettled',
    //   args: [paymentHash],
    // });
    // return result as boolean;
    await Promise.resolve();
    throw new Error('FacilitatorClient.isSettled() not yet implemented');
  }
}

// ============ ABI Encoding Helpers ============

// Function selectors (placeholder — compute from ABI when integrating viem)
const SETTLE_PAYMENT_SELECTOR = '0x00000001' as Hex; // settlePayment(SettlementParams)
const SETTLE_DELEGATED_SELECTOR = '0x00000002' as Hex; // settleDelegated(bytes32,SettlementParams)
const BATCH_SETTLE_SELECTOR = '0x00000003' as Hex; // batchSettle(SettlementParams[])

/**
 * Encode settlePayment calldata
 * In production: use viem.encodeFunctionData with the ABI
 */
function encodeSettlePayment(params: SettlementParams): Hex {
  // TODO: Replace with viem.encodeFunctionData()
  void params;
  void SETTLE_PAYMENT_SELECTOR;
  throw new Error('encodeSettlePayment: implement with viem ABI encoding');
}

/**
 * Encode settleDelegated calldata
 */
function encodeSettleDelegated(delegationHash: Hex, params: SettlementParams): Hex {
  void delegationHash;
  void params;
  void SETTLE_DELEGATED_SELECTOR;
  throw new Error('encodeSettleDelegated: implement with viem ABI encoding');
}

/**
 * Encode batchSettle calldata
 */
function encodeBatchSettle(paramsList: SettlementParams[]): Hex {
  void paramsList;
  void BATCH_SETTLE_SELECTOR;
  throw new Error('encodeBatchSettle: implement with viem ABI encoding');
}

/**
 * Create a FacilitatorClient from resolved config
 */
export function createFacilitatorClient(config: {
  X402_FACILITATOR_ADDRESS?: string;
  WALLET_DELEGATE_ADDRESS?: string;
  RPC_URL?: string;
  CHAIN_ID: number;
}): FacilitatorClient {
  const facilitatorAddress = config.X402_FACILITATOR_ADDRESS as Hex | undefined;
  const walletDelegateAddress = config.WALLET_DELEGATE_ADDRESS as Hex | undefined;
  const rpcUrl = config.RPC_URL;

  if (!facilitatorAddress || !walletDelegateAddress || !rpcUrl) {
    throw new Error(
      'FacilitatorClient requires X402_FACILITATOR_ADDRESS, WALLET_DELEGATE_ADDRESS, and RPC_URL'
    );
  }

  return new FacilitatorClient({
    facilitatorAddress,
    walletDelegateAddress,
    rpcUrl,
    chainId: config.CHAIN_ID,
  });
}
