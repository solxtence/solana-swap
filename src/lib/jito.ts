import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import axios from "axios";

// Jito Tip Accounts
const JITO_TIP_ADDRESSES = [
    "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
    "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
    "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
    "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
    "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
    "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
    "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
    "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT"
];

const JITO_API_ENDPOINT = "https://mainnet.block-engine.jito.wtf/api/v1/bundles";

export async function submitJitoBundle(txs: Array<string>) {
    const bundleRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "sendBundle",
        params: [txs],
    };
    try {
        const response = await axios.post(JITO_API_ENDPOINT, bundleRequest, {
            headers: { "Content-Type": "application/json" },
        });
        return response.data;
    } catch (error: any) {
        if (error?.response?.data?.error) {
            throw new Error(`Jito bundle submission error: ${JSON.stringify(error.response.data.error)}`);
        }
        throw new Error("Failed to submit Jito bundle.");
    }
}

export const generateJitoTipTx = async (senderAddress: string, tipAmount: number) => {
    const randomTipAccount = JITO_TIP_ADDRESSES[Math.floor(Math.random() * JITO_TIP_ADDRESSES.length)];
    return new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: new PublicKey(senderAddress),
            toPubkey: new PublicKey(randomTipAccount),
            lamports: tipAmount * LAMPORTS_PER_SOL,
        })
    );
}

export async function fetchJitoBundleStatuses(bundleIds: string[]) {
    const statusRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "getBundleStatuses",
        params: [bundleIds],
    };
    try {
        const response = await axios.post(JITO_API_ENDPOINT, statusRequest, {
            headers: { "Content-Type": "application/json" },
        });
        return response.data;
    } catch (error: any) {
        if (error?.response?.data?.error) {
            throw new Error(`Jito bundle status fetch error: ${JSON.stringify(error.response.data.error)}`);
        }
        throw new Error("Failed to retrieve Jito bundle statuses.");
    }
}

export async function monitorJitoBundleStatus(
    bundleId: string,
    maxAttempts: number = 10,
    desiredCommitment: 'processed' | 'confirmed' | 'finalized' = 'confirmed',
    checkInterval: number = 1000
): Promise<string | 'not_included' | 'max_attempts_reached' | 'error'> {
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            const statusResponse = await fetchJitoBundleStatuses([bundleId]);
            const bundleInfo = statusResponse.result.value.find(
                (bundle: any) => bundle.bundle_id === bundleId
            );

            if (!bundleInfo) {
                await new Promise(resolve => setTimeout(resolve, checkInterval));
                attempts++;
                continue;
            }

            const currentStatus = bundleInfo.confirmation_status;
            const isStatusAcceptable =
                (desiredCommitment === 'processed' && ['processed', 'confirmed', 'finalized'].includes(currentStatus)) ||
                (desiredCommitment === 'confirmed' && ['confirmed', 'finalized'].includes(currentStatus)) ||
                (desiredCommitment === 'finalized' && currentStatus === 'finalized');

            if (isStatusAcceptable) {
                return bundleInfo.err.Ok === null
                    ? bundleInfo.transactions[0]
                    : Promise.reject(new Error(`Jito Bundle Error: ${JSON.stringify(bundleInfo.err)}`));
            }

            await new Promise(resolve => setTimeout(resolve, checkInterval));
            attempts++;
        } catch (error) {
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            attempts++;
        }
    }

    return 'max_attempts_reached';
}