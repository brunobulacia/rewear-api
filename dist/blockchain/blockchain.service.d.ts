import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class BlockchainService implements OnModuleInit {
    private config;
    private readonly logger;
    private nftContract;
    private escrowContract;
    private provider;
    constructor(config: ConfigService);
    onModuleInit(): Promise<void>;
    get isNftActive(): boolean;
    mintPassport(ownerAddress: string, garmentId: string, tokenURI: string): Promise<string | null>;
    transferPassport(toAddress: string, tokenId: string): Promise<boolean>;
    getNftContractAddress(): Promise<string | null>;
    getTotalSupply(): Promise<number>;
    getTokenHistory(tokenId: string): Promise<Array<{
        type: 'MINT' | 'TRANSFER';
        from: string;
        to: string;
        txHash: string;
        blockNumber: number;
        timestamp: number;
    }>>;
    get isEscrowActive(): boolean;
    confirmDelivery(tradeId: string): Promise<boolean>;
    resolveDispute(tradeId: string, buyerWins: boolean): Promise<boolean>;
    getEscrowContractAddress(): Promise<string | null>;
}
