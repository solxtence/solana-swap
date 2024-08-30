export interface QuoteResponse {
    swapDetails: {
        inputAmount: number;
        outputAmount: number;
        minimumOutputAmount: number;
        priceData: {
            spotPrice: number;
            effectivePrice: number;
            priceImpactPercentage: number;
        };
        feeInfo: {
            swapFee: number;
            platformFeeAmount: number;
            platformFeeFormatted: number;
        };
    };
    tokenInfo: {
        sourceToken: {
            address: string;
            decimalPlaces: number;
        };
        destinationToken: {
            address: string;
            decimalPlaces: number;
        };
    };
}
export interface SwapResponse {
    transaction: {
        serializedTx: string;
        txType: string;
        executionTime: number;
    };
    swapDetails: {
        inputAmount: number;
        outputAmount: number;
        minimumOutputAmount: number;
        priceData: {
            spotPrice: number;
            effectivePrice: number;
            priceImpactPercentage: number;
        };
        feeInfo: {
            swapFee: number;
            platformFeeAmount: number;
            platformFeeFormatted: number;
        };
    };
    tokenInfo: {
        sourceToken: {
            address: string;
            decimalPlaces: number;
        };
        destinationToken: {
            address: string;
            decimalPlaces: number;
        };
    };
}
