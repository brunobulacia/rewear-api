import { RatingsService, CreateRatingDto } from './ratings.service';
export declare class RatingsController {
    private readonly service;
    constructor(service: RatingsService);
    create(dto: CreateRatingDto, user: {
        userId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        score: number;
        transactionId: string;
        comment: string | null;
        fromUserId: string;
        toUserId: string;
    }>;
    getByUser(userId: string): Promise<{
        ratings: ({
            transaction: {
                garment: {
                    id: string;
                    titulo: string;
                    imagenes: string[];
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                sellerId: string;
                garmentId: string;
                amount: number;
                escrowTradeId: string | null;
                escrowTxHash: string | null;
                buyerId: string;
                status: import(".prisma/client").$Enums.TransactionStatus;
            };
            fromUser: {
                id: string;
                walletAddress: string;
                nombre: string;
            };
        } & {
            id: string;
            createdAt: Date;
            score: number;
            transactionId: string;
            comment: string | null;
            fromUserId: string;
            toUserId: string;
        })[];
        avg: number;
        total: number;
    }>;
    getByTransaction(transactionId: string): Promise<{
        id: string;
        createdAt: Date;
        score: number;
        transactionId: string;
        comment: string | null;
        fromUserId: string;
        toUserId: string;
    }>;
}
