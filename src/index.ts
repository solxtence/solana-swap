import axios from "axios";
import {
  Connection,
  VersionedTransaction,
  Keypair,
  BlockhashWithExpiryBlockHeight,
  Transaction,
} from "@solana/web3.js";
import { handleTransaction, TxHandlerConfig } from "./lib/sender";
import { QuoteResponse, SwapResponse } from "./types";
import { submitJitoBundle, generateJitoTipTx, monitorJitoBundleStatus } from "./lib/jito";
import { extractEncodedSignature } from "./lib/utils";

export class SolanaSwap {
  private baseUrl = "https://swap.solxtence.com";
  private readonly connection: Connection;
  private readonly keypair: Keypair;

  constructor(keypair: Keypair, rpc: string) {
    this.connection = new Connection(rpc);
    this.keypair = keypair;
  }

  async setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  async getQuote(
    from: string,
    to: string,
    amount: number,
    slippage: number
  ): Promise<QuoteResponse> {
    const params = new URLSearchParams({
      from,
      to,
      amount: amount.toString(),
      slippage: slippage.toString(),
    });
    const url = `${this.baseUrl}/rate?${params}`;
    try {
      const response = await axios.get(url);
      return response.data as QuoteResponse;
    } catch (error) {
      throw error;
    }
  }

  async getSwapInstructions(
    from: string,
    to: string,
    fromAmount: number | string,
    slippage: number,
    payer: string,
    priorityFee?: number,
    forceLegacy?: boolean
  ): Promise<SwapResponse> {
    const params = new URLSearchParams({
      from,
      to,
      amount: fromAmount.toString(),
      slip: slippage.toString(),
      payer,
      txType: forceLegacy ? "legacy" : "v0",
    });
    if (priorityFee) {
      params.append("fee", priorityFee.toString());
    }
    const url = `${this.baseUrl}/swap?${params}`;
    try {
      const response = await axios.get(url);
      return response.data as SwapResponse;
    } catch (error) {
      throw error;
    }
  }

  async performSwap(
    swapResponse: SwapResponse,
    options: TxHandlerConfig = {
      sendConfig: { skipPreflight: true },
      maxConfirmationAttempts: 30,
      confirmationTimeout: 1000,
      lastValidBlockHeightBuffer: 150,
      commitmentLevel: "processed",
      resendDelay: 1000,
      statusCheckInterval: 1000,
      bypassConfirmation: false,
      jitoConfig: {
        active: false,
        tip: 0
      }
    }
  ): Promise<string> {
    let serializedTransactionBuffer: Buffer | Uint8Array;

    try {
      serializedTransactionBuffer = Buffer.from(swapResponse.transaction.serializedTx, "base64");
    } catch (error) {
      const base64Str = swapResponse.transaction.serializedTx;
      const binaryStr = atob(base64Str);
      const buffer = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        buffer[i] = binaryStr.charCodeAt(i);
      }
      serializedTransactionBuffer = buffer;
    }
    let txn: VersionedTransaction | Transaction;

    const blockhash = await this.connection.getLatestBlockhash();
    const blockhashWithExpiryBlockHeight: BlockhashWithExpiryBlockHeight = {
      blockhash: blockhash.blockhash,
      lastValidBlockHeight: blockhash.lastValidBlockHeight,
    };

    if (swapResponse.transaction.txType === 'v0') {
      txn = VersionedTransaction.deserialize(serializedTransactionBuffer);
      txn.sign([this.keypair]);
    } else {
      txn = Transaction.from(serializedTransactionBuffer);
      txn.sign(this.keypair);
    }

    if (options.jitoConfig?.active) {
      // Create a tip transaction for the Jito block engine
      const tipTxn = await generateJitoTipTx(this.keypair.publicKey.toBase58(), options.jitoConfig.tip);
      tipTxn.recentBlockhash = blockhash.blockhash;
      tipTxn.sign(this.keypair);

      const response = await submitJitoBundle([extractEncodedSignature(txn), extractEncodedSignature(tipTxn)]);
      if (response.result) {
        const txid = await monitorJitoBundleStatus(
          response.result,
          options.maxConfirmationAttempts,
          options.commitmentLevel,
          options.statusCheckInterval
        );
        return txid;
      }
    }

    const txid = await handleTransaction({
      conn: this.connection,
      txBuffer: txn.serialize() as Buffer,
      blockhashInfo: blockhashWithExpiryBlockHeight,
      config: options,
    });
    return txid.toString();
  }
}

module.exports = SolanaSwap
