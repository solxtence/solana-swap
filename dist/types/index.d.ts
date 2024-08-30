import { Keypair } from "@solana/web3.js";
import { TxHandlerConfig } from "./lib/sender";
import { QuoteResponse, SwapResponse } from "./types";
export declare class SolanaSwap {
    private baseUrl;
    private readonly connection;
    private readonly keypair;
    constructor(keypair: Keypair, rpc: string);
    setBaseUrl(url: string): Promise<void>;
    getQuote(from: string, to: string, amount: number, slippage: number): Promise<QuoteResponse>;
    getSwapInstructions(from: string, to: string, fromAmount: number | string, slippage: number, payer: string, priorityFee?: number, forceLegacy?: boolean): Promise<SwapResponse>;
    performSwap(swapResponse: SwapResponse, options?: TxHandlerConfig): Promise<string>;
}
