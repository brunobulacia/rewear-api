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
        garment: {
            id: string;
            titulo: string;
            precio: number;
            imagenes: string[];
        };
        disputes: {
            id: string;
            reason: string;
            status: import(".prisma/client").$Enums.DisputeStatus;
        }[];
        seller: {
            id: string;
            walletAddress: string;
            nombre: string;
        };
        buyer: {
            id: string;
            walletAddress: string;
            nombre: string;
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sellerId: string;
        garmentId: string;
        escrowTradeId: string | null;
        escrowTxHash: string | null;
        buyerId: string;
        status: import(".prisma/client").$Enums.TransactionStatus;
    }[]>;
    getDisputes(): Promise<({
        transaction: {
            garment: {
                id: string;
                titulo: string;
                imagenes: string[];
            };
            seller: {
                id: string;
                walletAddress: string;
                nombre: string;
            };
            buyer: {
                id: string;
                walletAddress: string;
                nombre: string;
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
    } & {
        id: string;
        createdAt: Date;
        reason: string;
        status: import(".prisma/client").$Enums.DisputeStatus;
        resolution: string | null;
        transactionId: string;
        openedById: string;
    })[]>;
    resolveDispute(transactionId: string, buyerWins: boolean): Promise<{
        ok: boolean;
    }>;
}
