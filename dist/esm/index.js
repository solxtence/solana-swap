var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from "axios";
import { Connection, VersionedTransaction, Transaction, } from "@solana/web3.js";
import { handleTransaction } from "./lib/sender";
import { submitJitoBundle, generateJitoTipTx, monitorJitoBundleStatus } from "./lib/jito";
import { extractEncodedSignature } from "./lib/utils";
export class SolanaSwap {
    constructor(keypair, rpc) {
        this.baseUrl = "https://swap.solxtence.com";
        this.connection = new Connection(rpc);
        this.keypair = keypair;
    }
    setBaseUrl(url) {
        return __awaiter(this, void 0, void 0, function* () {
            this.baseUrl = url;
        });
    }
    getQuote(from, to, amount, slippage) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = new URLSearchParams({
                from,
                to,
                amount: amount.toString(),
                slippage: slippage.toString(),
            });
            const url = `${this.baseUrl}/rate?${params}`;
            try {
                const response = yield axios.get(url);
                return response.data;
            }
            catch (error) {
                throw error;
            }
        });
    }
    getSwapInstructions(from, to, fromAmount, slippage, payer, priorityFee, forceLegacy) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const response = yield axios.get(url);
                return response.data;
            }
            catch (error) {
                throw error;
            }
        });
    }
    performSwap(swapResponse_1) {
        return __awaiter(this, arguments, void 0, function* (swapResponse, options = {
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
        }) {
            var _a;
            let serializedTransactionBuffer;
            try {
                serializedTransactionBuffer = Buffer.from(swapResponse.transaction.serializedTx, "base64");
            }
            catch (error) {
                const base64Str = swapResponse.transaction.serializedTx;
                const binaryStr = atob(base64Str);
                const buffer = new Uint8Array(binaryStr.length);
                for (let i = 0; i < binaryStr.length; i++) {
                    buffer[i] = binaryStr.charCodeAt(i);
                }
                serializedTransactionBuffer = buffer;
            }
            let txn;
            const blockhash = yield this.connection.getLatestBlockhash();
            const blockhashWithExpiryBlockHeight = {
                blockhash: blockhash.blockhash,
                lastValidBlockHeight: blockhash.lastValidBlockHeight,
            };
            if (swapResponse.transaction.txType === 'v0') {
                txn = VersionedTransaction.deserialize(serializedTransactionBuffer);
                txn.sign([this.keypair]);
            }
            else {
                txn = Transaction.from(serializedTransactionBuffer);
                txn.sign(this.keypair);
            }
            if ((_a = options.jitoConfig) === null || _a === void 0 ? void 0 : _a.active) {
                // Create a tip transaction for the Jito block engine
                const tipTxn = yield generateJitoTipTx(this.keypair.publicKey.toBase58(), options.jitoConfig.tip);
                tipTxn.recentBlockhash = blockhash.blockhash;
                tipTxn.sign(this.keypair);
                const response = yield submitJitoBundle([extractEncodedSignature(txn), extractEncodedSignature(tipTxn)]);
                if (response.result) {
                    const txid = yield monitorJitoBundleStatus(response.result, options.maxConfirmationAttempts, options.commitmentLevel, options.statusCheckInterval);
                    return txid;
                }
            }
            const txid = yield handleTransaction({
                conn: this.connection,
                txBuffer: txn.serialize(),
                blockhashInfo: blockhashWithExpiryBlockHeight,
                config: options,
            });
            return txid.toString();
        });
    }
}
module.exports = SolanaSwap;
