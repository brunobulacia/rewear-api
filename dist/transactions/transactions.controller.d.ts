import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ConfirmDeliveryDto, OpenDisputeDto, ResolveDisputeDto } from './dto/update-transaction.dto';
export declare class TransactionsController {
    private readonly service;
    constructor(service: TransactionsService);
    create(dto: CreateTransactionDto, user: {
        userId: string;
    }): Promise<{
        buyer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            walletAddress: string;
            nombre: string | null;
            email: string | null;
            ubicacion: string | null;
            avatar: string | null;
            rol: import(".prisma/client").$Enums.Role;
        };
        seller: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            walletAddress: string;
            nombre: string | null;
            email: string | null;
            ubicacion: string | null;
            avatar: string | null;
            rol: import(".prisma/client").$Enums.Role;
        };
        garment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sellerId: string;
            titulo: string;
            descripcion: string | null;
            marca: string | null;
            talla: string | null;
            categoria: string | null;
            estilo: string | null;
            precio: number;
            estado: import(".prisma/client").$Enums.GarmentStatus;
            imagenes: string[];
            imageHash: string | null;
            nftTokenId: string | null;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
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
    }>;
    findMine(user: {
        userId: string;
    }): Promise<{
        amountMatic: number;
        dispute: {
            id: string;
            status: import(".prisma/client").$Enums.DisputeStatus;
            createdAt: Date;
            transactionId: string;
            openedById: string;
            reason: string;
            resolution: string | null;
        };
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
            marca: string;
            talla: string;
            precio: number;
            imagenes: string[];
        };
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
    findOne(id: string, user: {
        userId: string;
    }): Promise<{
        buyer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            walletAddress: string;
            nombre: string | null;
            email: string | null;
            ubicacion: string | null;
            avatar: string | null;
            rol: import(".prisma/client").$Enums.Role;
        };
        seller: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            walletAddress: string;
            nombre: string | null;
            email: string | null;
            ubicacion: string | null;
            avatar: string | null;
            rol: import(".prisma/client").$Enums.Role;
        };
        garment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sellerId: string;
            titulo: string;
            descripcion: string | null;
            marca: string | null;
            talla: string | null;
            categoria: string | null;
            estilo: string | null;
            precio: number;
            estado: import(".prisma/client").$Enums.GarmentStatus;
            imagenes: string[];
            imageHash: string | null;
            nftTokenId: string | null;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        };
        disputes: {
            id: string;
            status: import(".prisma/client").$Enums.DisputeStatus;
            createdAt: Date;
            transactionId: string;
            openedById: string;
            reason: string;
            resolution: string | null;
        }[];
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
    }>;
    confirmDelivery(id: string, dto: ConfirmDeliveryDto, user: {
        userId: string;
    }): Promise<{
        buyer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            walletAddress: string;
            nombre: string | null;
            email: string | null;
            ubicacion: string | null;
            avatar: string | null;
            rol: import(".prisma/client").$Enums.Role;
        };
        seller: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            walletAddress: string;
            nombre: string | null;
            email: string | null;
            ubicacion: string | null;
            avatar: string | null;
            rol: import(".prisma/client").$Enums.Role;
        };
        garment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sellerId: string;
            titulo: string;
            descripcion: string | null;
            marca: string | null;
            talla: string | null;
            categoria: string | null;
            estilo: string | null;
            precio: number;
            estado: import(".prisma/client").$Enums.GarmentStatus;
            imagenes: string[];
            imageHash: string | null;
            nftTokenId: string | null;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
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
    }>;
    openDispute(id: string, dto: OpenDisputeDto, user: {
        userId: string;
    }): Promise<{
        buyer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            walletAddress: string;
            nombre: string | null;
            email: string | null;
            ubicacion: string | null;
            avatar: string | null;
            rol: import(".prisma/client").$Enums.Role;
        };
        seller: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            walletAddress: string;
            nombre: string | null;
            email: string | null;
            ubicacion: string | null;
            avatar: string | null;
            rol: import(".prisma/client").$Enums.Role;
        };
        garment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sellerId: string;
            titulo: string;
            descripcion: string | null;
            marca: string | null;
            talla: string | null;
            categoria: string | null;
            estilo: string | null;
            precio: number;
            estado: import(".prisma/client").$Enums.GarmentStatus;
            imagenes: string[];
            imageHash: string | null;
            nftTokenId: string | null;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
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
    }>;
    cancelPurchase(id: string, dto: OpenDisputeDto, user: {
        userId: string;
    }): Promise<{
        buyer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            walletAddress: string;
            nombre: string | null;
            email: string | null;
            ubicacion: string | null;
            avatar: string | null;
            rol: import(".prisma/client").$Enums.Role;
        };
        seller: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            walletAddress: string;
            nombre: string | null;
            email: string | null;
            ubicacion: string | null;
            avatar: string | null;
            rol: import(".prisma/client").$Enums.Role;
        };
        garment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sellerId: string;
            titulo: string;
            descripcion: string | null;
            marca: string | null;
            talla: string | null;
            categoria: string | null;
            estilo: string | null;
            precio: number;
            estado: import(".prisma/client").$Enums.GarmentStatus;
            imagenes: string[];
            imageHash: string | null;
            nftTokenId: string | null;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
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
    }>;
    resolveDispute(id: string, dto: ResolveDisputeDto): Promise<{
        buyer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            walletAddress: string;
            nombre: string | null;
            email: string | null;
            ubicacion: string | null;
            avatar: string | null;
            rol: import(".prisma/client").$Enums.Role;
        };
        seller: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            walletAddress: string;
            nombre: string | null;
            email: string | null;
            ubicacion: string | null;
            avatar: string | null;
            rol: import(".prisma/client").$Enums.Role;
        };
        garment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sellerId: string;
            titulo: string;
            descripcion: string | null;
            marca: string | null;
            talla: string | null;
            categoria: string | null;
            estilo: string | null;
            precio: number;
            estado: import(".prisma/client").$Enums.GarmentStatus;
            imagenes: string[];
            imageHash: string | null;
            nftTokenId: string | null;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
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
    }>;
}
