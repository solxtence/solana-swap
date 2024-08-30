import {
  Connection,
  SendOptions,
  TransactionSignature,
  Commitment,
} from "@solana/web3.js";

// Define structure for blockhash and its expiry
interface BlockhashWithExpiryBlockHeight {
  blockhash: string;
  lastValidBlockHeight: number;
}

// Custom error class for transaction-related issues
class TxError extends Error {
  txSignature: string;

  constructor(msg: string, txSignature: string) {
    super(msg);
    this.name = 'TxError';
    this.txSignature = txSignature;
  }
}

// Mapping of commitment levels to their respective priorities
export const COMMITMENT_PRIORITY: Record<Commitment, number> = {
  processed: 0,
  confirmed: 1,
  finalized: 2,
  recent: 0,     // Maps to 'processed'
  single: 1,     // Maps to 'confirmed'
  singleGossip: 1, // Maps to 'confirmed'
  root: 2,       // Maps to 'finalized'
  max: 2,        // Maps to 'finalized'
};

export type ValidCommitment = 'processed' | 'confirmed' | 'finalized';

// Configuration options for transaction handling
export interface TxHandlerConfig {
  sendConfig?: SendOptions;
  maxConfirmationAttempts?: number;
  confirmationTimeout?: number;
  lastValidBlockHeightBuffer?: number;
  resendDelay?: number;
  statusCheckInterval?: number;
  bypassConfirmation?: boolean;
  commitmentLevel?: ValidCommitment;
  jitoConfig?: {
    active: boolean;
    tip: number;
  };
}

// Default configuration for transaction handling
const DEFAULT_CONFIG: TxHandlerConfig = {
  sendConfig: { skipPreflight: true },
  maxConfirmationAttempts: 30,
  confirmationTimeout: 1000,
  lastValidBlockHeightBuffer: 150,
  resendDelay: 1000,
  statusCheckInterval: 1000,
  bypassConfirmation: false,
  commitmentLevel: "processed",
  jitoConfig: {
    active: false,
    tip: 0,
  }
};

// Main function to handle transaction sending and confirmation
async function handleTransaction({
  conn,
  txBuffer,
  blockhashInfo,
  config = DEFAULT_CONFIG,
}: {
  conn: Connection;
  txBuffer: Buffer;
  blockhashInfo: BlockhashWithExpiryBlockHeight;
  config?: Partial<TxHandlerConfig>;
}): Promise<TransactionSignature> {
  const {
    sendConfig,
    maxConfirmationAttempts,
    lastValidBlockHeightBuffer,
    statusCheckInterval,
    bypassConfirmation,
    commitmentLevel
  } = { ...DEFAULT_CONFIG, ...config };

  const safeExpiryHeight = blockhashInfo.lastValidBlockHeight - (lastValidBlockHeightBuffer || 150);

  // Initiate transaction
  let txSignature: TransactionSignature;
  try {
    txSignature = await conn.sendRawTransaction(txBuffer, sendConfig);
  } catch (err: any) {
    throw new TxError(`Transaction initiation failed: ${err.message}`, '');
  }

  // Early return if confirmation check is bypassed
  if (bypassConfirmation) {
    return txSignature;
  }

  // Confirmation loop
  let attempts = 0;
  while (attempts <= (maxConfirmationAttempts || 30)) {
    try {
      const txStatus = await conn.getSignatureStatus(txSignature);

      if (txStatus.value?.confirmationStatus &&
        COMMITMENT_PRIORITY[txStatus.value.confirmationStatus] >= COMMITMENT_PRIORITY[commitmentLevel as ValidCommitment]) {
        return txSignature;
      }

      if (txStatus.value?.err) {
        throw new TxError(`Transaction encountered an error: ${txStatus.value.err}`, txSignature);
      }

      const currentBlockHeight = await conn.getBlockHeight();
      if (currentBlockHeight > safeExpiryHeight) {
        throw new TxError("Transaction validity period exceeded", txSignature);
      }

      await new Promise((resolve) => setTimeout(resolve, statusCheckInterval));

      attempts++;
    } catch (err: any) {
      if (err instanceof TxError) {
        throw err;
      }
      throw new TxError(`Confirmation process encountered an error: ${err.message}`, txSignature);
    }
  }

  throw new TxError("Transaction confirmation failed after maximum attempts", txSignature);
}

export { handleTransaction };