import { Transaction } from "@solana/web3.js";
export declare function submitJitoBundle(txs: Array<string>): Promise<any>;
export declare const generateJitoTipTx: (senderAddress: string, tipAmount: number) => Promise<Transaction>;
export declare function fetchJitoBundleStatuses(bundleIds: string[]): Promise<any>;
export declare function monitorJitoBundleStatus(bundleId: string, maxAttempts?: number, desiredCommitment?: 'processed' | 'confirmed' | 'finalized', checkInterval?: number): Promise<string | 'not_included' | 'max_attempts_reached' | 'error'>;
