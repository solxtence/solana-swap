import bs58 from "bs58";
/**
 * Extracts and encodes the signature from a Solana transaction.
 * @param tx - The Solana transaction (either Transaction or VersionedTransaction)
 * @returns The base58-encoded signature string
 * @throws Error if the transaction is not signed by the fee payer
 */
export function extractEncodedSignature(tx) {
    const signature = "signature" in tx ? tx.signature : tx.signatures[0];
    if (!signature) {
        throw new Error("Transaction signature missing. Ensure the transaction is signed by the fee payer.");
    }
    return bs58.encode(signature);
}
/**
 * Creates a promise that resolves after a specified time.
 * @param durationMs - The duration to wait in milliseconds
 * @returns A promise that resolves after the specified duration
 */
export const delay = (durationMs) => new Promise((resolve) => setTimeout(resolve, durationMs));
