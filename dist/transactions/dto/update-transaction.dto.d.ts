export declare class ConfirmDeliveryDto {
    txHash: string;
}
export declare class OpenDisputeDto {
    txHash: string;
    reason?: string;
}
export declare class ResolveDisputeDto {
    buyerWins: boolean;
    txHash?: string;
}
