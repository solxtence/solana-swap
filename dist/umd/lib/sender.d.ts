import { Connection, SendOptions, TransactionSignature, Commitment } from "@solana/web3.js";
interface BlockhashWithExpiryBlockHeight {
    blockhash: string;
    lastValidBlockHeight: number;
}
export declare const COMMITMENT_PRIORITY: Record<Commitment, number>;
export type ValidCommitment = 'processed' | 'confirmed' | 'finalized';
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
declare function handleTransaction({ conn, txBuffer, blockhashInfo, config, }: {
    conn: Connection;
    txBuffer: Buffer;
    blockhashInfo: BlockhashWithExpiryBlockHeight;
    config?: Partial<TxHandlerConfig>;
}): Promise<TransactionSignature>;
export { handleTransaction };
