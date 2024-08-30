var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.COMMITMENT_PRIORITY = void 0;
    exports.handleTransaction = handleTransaction;
    // Custom error class for transaction-related issues
    class TxError extends Error {
        constructor(msg, txSignature) {
            super(msg);
            this.name = 'TxError';
            this.txSignature = txSignature;
        }
    }
    // Mapping of commitment levels to their respective priorities
    exports.COMMITMENT_PRIORITY = {
        processed: 0,
        confirmed: 1,
        finalized: 2,
        recent: 0, // Maps to 'processed'
        single: 1, // Maps to 'confirmed'
        singleGossip: 1, // Maps to 'confirmed'
        root: 2, // Maps to 'finalized'
        max: 2, // Maps to 'finalized'
    };
    // Default configuration for transaction handling
    const DEFAULT_CONFIG = {
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
    function handleTransaction(_a) {
        return __awaiter(this, arguments, void 0, function* ({ conn, txBuffer, blockhashInfo, config = DEFAULT_CONFIG, }) {
            var _b, _c;
            const { sendConfig, maxConfirmationAttempts, lastValidBlockHeightBuffer, statusCheckInterval, bypassConfirmation, commitmentLevel } = Object.assign(Object.assign({}, DEFAULT_CONFIG), config);
            const safeExpiryHeight = blockhashInfo.lastValidBlockHeight - (lastValidBlockHeightBuffer || 150);
            // Initiate transaction
            let txSignature;
            try {
                txSignature = yield conn.sendRawTransaction(txBuffer, sendConfig);
            }
            catch (err) {
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
                    const txStatus = yield conn.getSignatureStatus(txSignature);
                    if (((_b = txStatus.value) === null || _b === void 0 ? void 0 : _b.confirmationStatus) &&
                        exports.COMMITMENT_PRIORITY[txStatus.value.confirmationStatus] >= exports.COMMITMENT_PRIORITY[commitmentLevel]) {
                        return txSignature;
                    }
                    if ((_c = txStatus.value) === null || _c === void 0 ? void 0 : _c.err) {
                        throw new TxError(`Transaction encountered an error: ${txStatus.value.err}`, txSignature);
                    }
                    const currentBlockHeight = yield conn.getBlockHeight();
                    if (currentBlockHeight > safeExpiryHeight) {
                        throw new TxError("Transaction validity period exceeded", txSignature);
                    }
                    yield new Promise((resolve) => setTimeout(resolve, statusCheckInterval));
                    attempts++;
                }
                catch (err) {
                    if (err instanceof TxError) {
                        throw err;
                    }
                    throw new TxError(`Confirmation process encountered an error: ${err.message}`, txSignature);
                }
            }
            throw new TxError("Transaction confirmation failed after maximum attempts", txSignature);
        });
    }
});
