import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ConfirmDeliveryDto, OpenDisputeDto, ResolveDisputeDto } from './dto/update-transaction.dto';
export declare class TransactionsService {
    private prisma;
    private blockchain;
    private readonly logger;
    constructor(prisma: PrismaService, blockchain: BlockchainService);
    create(dto: CreateTransactionDto, buyerId: string): Promise<{
        garment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            titulo: string;
            descripcion: string | null;
            marca: string | null;
            talla: string | null;
            categoria: string | null;
            estilo: string | null;
            precio: number;
            estado: import(".prisma/client").$Enums.GarmentStatus;
            sellerId: string;
            imagenes: string[];
            imageHash: string | null;
            nftTokenId: string | null;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        };
        seller: {
            id: string;
            walletAddress: string;
            nombre: string | null;
            email: string | null;
            ubicacion: string | null;
            avatar: string | null;
            rol: import(".prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
        };
        buyer: {
            id: string;
            walletAddress: string;
            nombre: string | null;
            email: string | null;
            ubicacion: string | null;
            avatar: string | null;
            rol: import(".prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
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
    }>;
    confirmDelivery(transactionId: string, dto: ConfirmDeliveryDto, userId: string): Promise<{
        garment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            titulo: string;
            descripcion: string | null;
            marca: string | null;
            talla: string | null;
            categoria: string | null;
            estilo: string | null;
            precio: number;
            estado: import(".prisma/client").$Enums.GarmentStatus;
            sellerId: string;
            imagenes: string[];
            imageHash: string | null;
            nftTokenId: string | null;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        };
        seller: {
            id: string;
            walletAddress: string;
            nombre: string | null;
            email: string | null;
            ubicacion: string | null;
            avatar: string | null;
            rol: import(".prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
        };
        buyer: {
            id: string;
            walletAddress: string;
            nombre: string | null;
            email: string | null;
            ubicacion: string | null;
            avatar: string | null;
            rol: import(".prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
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
    }>;
    openDispute(transactionId: string, dto: OpenDisputeDto, userId: string): Promise<{
        garment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            titulo: string;
            descripcion: string | null;
            marca: string | null;
            talla: string | null;
            categoria: string | null;
            estilo: string | null;
            precio: number;
            estado: import(".prisma/client").$Enums.GarmentStatus;
            sellerId: string;
            imagenes: string[];
            imageHash: string | null;
            nftTokenId: string | null;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        };
        seller: {
            id: string;
            walletAddress: string;
            nombre: string | null;
            email: string | null;
            ubicacion: string | null;
            avatar: string | null;
            rol: import(".prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
        };
        buyer: {
            id: string;
            walletAddress: string;
            nombre: string | null;
            email: string | null;
            ubicacion: string | null;
            avatar: string | null;
            rol: import(".prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
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
    }>;
    resolveDispute(transactionId: string, dto: ResolveDisputeDto): Promise<{
        garment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            titulo: string;
            descripcion: string | null;
            marca: string | null;
            talla: string | null;
            categoria: string | null;
            estilo: string | null;
            precio: number;
            estado: import(".prisma/client").$Enums.GarmentStatus;
            sellerId: string;
            imagenes: string[];
            imageHash: string | null;
            nftTokenId: string | null;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        };
        seller: {
            id: string;
            walletAddress: string;
            nombre: string | null;
            email: string | null;
            ubicacion: string | null;
            avatar: string | null;
            rol: import(".prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
        };
        buyer: {
            id: string;
            walletAddress: string;
            nombre: string | null;
            email: string | null;
            ubicacion: string | null;
            avatar: string | null;
            rol: import(".prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
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
    }>;
    findMine(userId: string): Promise<{
        amountMatic: number;
        dispute: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.DisputeStatus;
            reason: string;
            resolution: string | null;
            transactionId: string;
            openedById: string;
        };
        garment: {
            id: string;
            titulo: string;
            marca: string;
            talla: string;
            precio: number;
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
    findOne(transactionId: string, userId: string): Promise<{
        garment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            titulo: string;
            descripcion: string | null;
            marca: string | null;
            talla: string | null;
            categoria: string | null;
            estilo: string | null;
            precio: number;
            estado: import(".prisma/client").$Enums.GarmentStatus;
            sellerId: string;
            imagenes: string[];
            imageHash: string | null;
            nftTokenId: string | null;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        };
        disputes: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.DisputeStatus;
            reason: string;
            resolution: string | null;
            transactionId: string;
            openedById: string;
        }[];
        seller: {
            id: string;
            walletAddress: string;
            nombre: string | null;
            email: string | null;
            ubicacion: string | null;
            avatar: string | null;
            rol: import(".prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
        };
        buyer: {
            id: string;
            walletAddress: string;
            nombre: string | null;
            email: string | null;
            ubicacion: string | null;
            avatar: string | null;
            rol: import(".prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
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
    }>;
    private getOrThrow;
}
