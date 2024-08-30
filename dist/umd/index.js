var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "axios", "@solana/web3.js", "./lib/sender", "./lib/jito", "./lib/utils"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SolanaSwap = void 0;
    const axios_1 = __importDefault(require("axios"));
    const web3_js_1 = require("@solana/web3.js");
    const sender_1 = require("./lib/sender");
    const jito_1 = require("./lib/jito");
    const utils_1 = require("./lib/utils");
    class SolanaSwap {
        constructor(keypair, rpc) {
            this.baseUrl = "https://swap.solxtence.com";
            this.connection = new web3_js_1.Connection(rpc);
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
                    const response = yield axios_1.default.get(url);
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
                    const response = yield axios_1.default.get(url);
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
                    txn = web3_js_1.VersionedTransaction.deserialize(serializedTransactionBuffer);
                    txn.sign([this.keypair]);
                }
                else {
                    txn = web3_js_1.Transaction.from(serializedTransactionBuffer);
                    txn.sign(this.keypair);
                }
                if ((_a = options.jitoConfig) === null || _a === void 0 ? void 0 : _a.active) {
                    // Create a tip transaction for the Jito block engine
                    const tipTxn = yield (0, jito_1.generateJitoTipTx)(this.keypair.publicKey.toBase58(), options.jitoConfig.tip);
                    tipTxn.recentBlockhash = blockhash.blockhash;
                    tipTxn.sign(this.keypair);
                    const response = yield (0, jito_1.submitJitoBundle)([(0, utils_1.extractEncodedSignature)(txn), (0, utils_1.extractEncodedSignature)(tipTxn)]);
                    if (response.result) {
                        const txid = yield (0, jito_1.monitorJitoBundleStatus)(response.result, options.maxConfirmationAttempts, options.commitmentLevel, options.statusCheckInterval);
                        return txid;
                    }
                }
                const txid = yield (0, sender_1.handleTransaction)({
                    conn: this.connection,
                    txBuffer: txn.serialize(),
                    blockhashInfo: blockhashWithExpiryBlockHeight,
                    config: options,
                });
                return txid.toString();
            });
        }
    }
    exports.SolanaSwap = SolanaSwap;
    module.exports = SolanaSwap;
});
