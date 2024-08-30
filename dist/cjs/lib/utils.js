"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = void 0;
exports.extractEncodedSignature = extractEncodedSignature;
const bs58_1 = __importDefault(require("bs58"));
/**
 * Extracts and encodes the signature from a Solana transaction.
 * @param tx - The Solana transaction (either Transaction or VersionedTransaction)
 * @returns The base58-encoded signature string
 * @throws Error if the transaction is not signed by the fee payer
 */
function extractEncodedSignature(tx) {
    const signature = "signature" in tx ? tx.signature : tx.signatures[0];
    if (!signature) {
        throw new Error("Transaction signature missing. Ensure the transaction is signed by the fee payer.");
    }
    return bs58_1.default.encode(signature);
}
/**
 * Creates a promise that resolves after a specified time.
 * @param durationMs - The duration to wait in milliseconds
 * @returns A promise that resolves after the specified duration
 */
const delay = (durationMs) => new Promise((resolve) => setTimeout(resolve, durationMs));
exports.delay = delay;
