import { PrismaService } from '../prisma/prisma.service';
export declare class CreateRatingDto {
    transactionId: string;
    score: number;
    comment?: string;
}
export declare class RatingsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateRatingDto, fromUserId: string): Promise<{
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
