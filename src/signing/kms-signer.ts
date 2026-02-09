/**
 * Cloud KMS Signer for IRSB Solver
 *
 * Direct signing via GCP Cloud KMS, replacing the agent-passkey
 * HTTP service for on-chain transaction signing.
 *
 * Benefits over agent-passkey:
 * - No network dependency on Lit Protocol
 * - Sub-100ms signing latency (vs 1-2s with Lit TEE)
 * - Keys never leave Google HSMs
 * - IAM-based access control with audit logging
 *
 * Environment variables:
 * - KMS_PROJECT_ID: GCP project ID
 * - KMS_LOCATION: Key location (default: us-central1)
 * - KMS_KEYRING: Keyring name
 * - KMS_KEY: Key name
 * - KMS_KEY_VERSION: Key version (default: 1)
 */

/** Ethereum hex string (0x-prefixed) */
type Hex = `0x${string}`;

/**
 * KMS Signer configuration
 */
export interface KmsSignerConfig {
  /** GCP project ID */
  projectId: string;

  /** KMS location (e.g., 'us-central1') */
  location: string;

  /** KMS keyring name */
  keyring: string;

  /** KMS key name */
  key: string;

  /** KMS key version (default: '1') */
  keyVersion?: string;

  /** Chain ID for transaction signing */
  chainId: number;
}

/**
 * Signing result
 */
export interface KmsSigningResult {
  /** Whether signing succeeded */
  success: boolean;

  /** Signed transaction hex */
  signedTx?: Hex;

  /** Transaction hash */
  txHash?: Hex;

  /** Signer address */
  signerAddress?: Hex;

  /** Error message if failed */
  error?: string;
}

/**
 * Cloud KMS Signer
 *
 * Signs transactions using GCP Cloud KMS secp256k1 keys.
 * Implements the same interface as AgentPasskeyClient for drop-in replacement.
 *
 * @example
 * ```typescript
 * const signer = new KmsSigner({
 *   projectId: 'irsb-protocol',
 *   location: 'us-central1',
 *   keyring: 'irsb-signing',
 *   key: 'solver-key',
 *   chainId: 11155111,
 * });
 *
 * const address = await signer.getSignerAddress();
 * const result = await signer.signDigest(digest);
 * ```
 */
export class KmsSigner {
  private config: Required<KmsSignerConfig>;
  private cachedAddress: Hex | null = null;

  constructor(config: KmsSignerConfig) {
    this.config = {
      ...config,
      keyVersion: config.keyVersion ?? '1',
    };
  }

  /**
   * Get the KMS key resource name
   */
  getKeyResourceName(): string {
    const { projectId, location, keyring, key, keyVersion } = this.config;
    return `projects/${projectId}/locations/${location}/keyRings/${keyring}/cryptoKeys/${key}/cryptoKeyVersions/${keyVersion}`;
  }

  /**
   * Get the Ethereum address derived from the KMS public key
   *
   * Implementation requires @google-cloud/kms:
   * 1. Fetch public key from KMS
   * 2. Parse ASN.1 DER to get raw secp256k1 point
   * 3. Compute keccak256 hash, take last 20 bytes
   */
  async getSignerAddress(): Promise<Hex> {
    if (this.cachedAddress) return this.cachedAddress;

    // TODO: Replace with actual KMS public key retrieval
    // const client = new KeyManagementServiceClient();
    // const [publicKey] = await client.getPublicKey({ name: this.getKeyResourceName() });
    // const address = publicKeyToEthAddress(publicKey.pem);
    // this.cachedAddress = address;
    // return address;

    await Promise.resolve();
    throw new Error(
      `KmsSigner: getSignerAddress() not yet implemented. ` +
      `Key: ${this.getKeyResourceName()}. ` +
      `Install @google-cloud/kms and implement public key derivation.`
    );
  }

  /**
   * Sign a keccak256 digest using KMS
   *
   * Implementation requires @google-cloud/kms:
   * 1. Call asymmetricSign with the digest
   * 2. Parse DER signature to (r, s)
   * 3. Compute recovery parameter (v)
   * 4. Return {r, s, v} signature
   */
  async signDigest(digest: Hex): Promise<{ r: Hex; s: Hex; v: number }> {
    // TODO: Replace with actual KMS signing
    // const client = new KeyManagementServiceClient();
    // const [result] = await client.asymmetricSign({
    //   name: this.getKeyResourceName(),
    //   digest: { sha256: Buffer.from(digest.slice(2), 'hex') },
    // });
    // return parseKmsSignature(result.signature, digest);

    await Promise.resolve();
    throw new Error(
      `KmsSigner: signDigest() not yet implemented. ` +
      `Digest: ${digest.slice(0, 10)}... ` +
      `Install @google-cloud/kms and implement asymmetric signing.`
    );
  }

  /**
   * Check if the KMS key is accessible
   */
  async isHealthy(): Promise<boolean> {
    // Will throw until getSignerAddress() is implemented
    await this.getSignerAddress();
    return true;
  }
}

/**
 * Create a KMS signer from resolved config
 */
export function createKmsSigner(config: {
  KMS_PROJECT_ID?: string;
  KMS_LOCATION: string;
  KMS_KEYRING?: string;
  KMS_KEY?: string;
  KMS_KEY_VERSION: string;
  CHAIN_ID: number;
}): KmsSigner {
  const projectId = config.KMS_PROJECT_ID;
  const keyring = config.KMS_KEYRING;
  const key = config.KMS_KEY;

  if (!projectId || !keyring || !key) {
    throw new Error(
      'KMS signer requires KMS_PROJECT_ID, KMS_KEYRING, and KMS_KEY in config'
    );
  }

  return new KmsSigner({
    projectId,
    location: config.KMS_LOCATION,
    keyring,
    key,
    keyVersion: config.KMS_KEY_VERSION,
    chainId: config.CHAIN_ID,
  });
}
