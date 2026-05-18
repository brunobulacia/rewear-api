import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly service;
    constructor(service: AdminService);
    getStats(): Promise<{
        totalUsers: number;
        totalGarments: number;
        verifiedGarments: number;
        activeTransactions: number;
        completedTransactions: number;
        openDisputes: number;
    }>;
    getTransactions(): Promise<({
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
    })[]>;
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
        status: import(".prisma/client").$Enums.DisputeStatus;
        reason: string;
        resolution: string | null;
        transactionId: string;
        openedById: string;
    })[]>;
    resolveDispute(transactionId: string, body: {
        buyerWins: boolean;
    }): Promise<{
        ok: boolean;
    }>;
}
