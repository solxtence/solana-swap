var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
export function submitJitoBundle(txs) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const bundleRequest = {
            jsonrpc: "2.0",
            id: 1,
            method: "sendBundle",
            params: [txs],
        };
        try {
            const response = yield axios.post(JITO_API_ENDPOINT, bundleRequest, {
                headers: { "Content-Type": "application/json" },
            });
            return response.data;
        }
        catch (error) {
            if ((_b = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) {
                throw new Error(`Jito bundle submission error: ${JSON.stringify(error.response.data.error)}`);
            }
            throw new Error("Failed to submit Jito bundle.");
        }
    });
}
export const generateJitoTipTx = (senderAddress, tipAmount) => __awaiter(void 0, void 0, void 0, function* () {
    const randomTipAccount = JITO_TIP_ADDRESSES[Math.floor(Math.random() * JITO_TIP_ADDRESSES.length)];
    return new Transaction().add(SystemProgram.transfer({
        fromPubkey: new PublicKey(senderAddress),
        toPubkey: new PublicKey(randomTipAccount),
        lamports: tipAmount * LAMPORTS_PER_SOL,
    }));
});
export function fetchJitoBundleStatuses(bundleIds) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const statusRequest = {
            jsonrpc: "2.0",
            id: 1,
            method: "getBundleStatuses",
            params: [bundleIds],
        };
        try {
            const response = yield axios.post(JITO_API_ENDPOINT, statusRequest, {
                headers: { "Content-Type": "application/json" },
            });
            return response.data;
        }
        catch (error) {
            if ((_b = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) {
                throw new Error(`Jito bundle status fetch error: ${JSON.stringify(error.response.data.error)}`);
            }
            throw new Error("Failed to retrieve Jito bundle statuses.");
        }
    });
}
export function monitorJitoBundleStatus(bundleId_1) {
    return __awaiter(this, arguments, void 0, function* (bundleId, maxAttempts = 10, desiredCommitment = 'confirmed', checkInterval = 1000) {
        let attempts = 0;
        while (attempts < maxAttempts) {
            try {
                const statusResponse = yield fetchJitoBundleStatuses([bundleId]);
                const bundleInfo = statusResponse.result.value.find((bundle) => bundle.bundle_id === bundleId);
                if (!bundleInfo) {
                    yield new Promise(resolve => setTimeout(resolve, checkInterval));
                    attempts++;
                    continue;
                }
                const currentStatus = bundleInfo.confirmation_status;
                const isStatusAcceptable = (desiredCommitment === 'processed' && ['processed', 'confirmed', 'finalized'].includes(currentStatus)) ||
                    (desiredCommitment === 'confirmed' && ['confirmed', 'finalized'].includes(currentStatus)) ||
                    (desiredCommitment === 'finalized' && currentStatus === 'finalized');
                if (isStatusAcceptable) {
                    return bundleInfo.err.Ok === null
                        ? bundleInfo.transactions[0]
                        : Promise.reject(new Error(`Jito Bundle Error: ${JSON.stringify(bundleInfo.err)}`));
                }
                yield new Promise(resolve => setTimeout(resolve, checkInterval));
                attempts++;
            }
            catch (error) {
                yield new Promise(resolve => setTimeout(resolve, checkInterval));
                attempts++;
            }
        }
        return 'max_attempts_reached';
    });
}
