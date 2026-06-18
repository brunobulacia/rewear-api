import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
export declare class AdminService {
    private readonly prisma;
    private readonly transactions;
    constructor(prisma: PrismaService, transactions: TransactionsService);
    getStats(): Promise<{
        totalUsers: number;
        totalGarments: number;
        verifiedGarments: number;
        activeTransactions: number;
        completedTransactions: number;
        openDisputes: number;
    }>;
    getTransactions(limit?: number): Promise<{
        amountMatic: number;
        buyer: {
            id: string;
            walletAddress: string;
            nombre: string;
        };
        seller: {
            id: string;
            walletAddress: string;
            nombre: string;
        };
        garment: {
            id: string;
            titulo: string;
            precio: number;
            imagenes: string[];
        };
        disputes: {
            id: string;
            status: import(".prisma/client").$Enums.DisputeStatus;
            reason: string;
        }[];
        id: string;
        escrowTxHash: string | null;
        escrowTradeId: string | null;
        status: import(".prisma/client").$Enums.TransactionStatus;
        createdAt: Date;
        updatedAt: Date;
        buyerId: string;
        sellerId: string;
        garmentId: string;
    }[]>;
    getDisputes(): Promise<({
        transaction: {
            buyer: {
                id: string;
                walletAddress: string;
                nombre: string;
            };
            seller: {
                id: string;
                walletAddress: string;
                nombre: string;
            };
            garment: {
                id: string;
                titulo: string;
                imagenes: string[];
            };
        } & {
            id: string;
            amount: number;
            escrowTxHash: string | null;
            escrowTradeId: string | null;
            status: import(".prisma/client").$Enums.TransactionStatus;
            createdAt: Date;
            updatedAt: Date;
            buyerId: string;
            sellerId: string;
            garmentId: string;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.DisputeStatus;
        createdAt: Date;
        transactionId: string;
        openedById: string;
        reason: string;
        resolution: string | null;
    })[]>;
    resolveDispute(transactionId: string, buyerWins: boolean): Promise<{
        ok: boolean;
    }>;
}
