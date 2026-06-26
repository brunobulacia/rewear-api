import { GarmentsService } from './garments.service';
import { CloudinaryService } from '../storage/cloudinary.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { VerificationService } from '../verification/verification.service';
import { ListGarmentsDto } from './dto/list-garments.dto';
import { CreateGarmentDto } from './dto/create-garment.dto';
import { UpdateGarmentDto } from './dto/update-garment.dto';
export declare class GarmentsController {
    private garmentsService;
    private cloudinary;
    private blockchain;
    private verificationService;
    constructor(garmentsService: GarmentsService, cloudinary: CloudinaryService, blockchain: BlockchainService, verificationService: VerificationService);
    private storeImage;
    create(files: Express.Multer.File[], dto: CreateGarmentDto, user: {
        userId: string;
        walletAddress: string;
    }): Promise<{
        seller: {
            id: string;
            walletAddress: string;
            nombre: string;
            avatar: string;
        };
    } & {
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
    }>;
    verifyImage(files: Express.Multer.File[]): Promise<{
        registered: boolean;
        imageHash: string;
        garment?: undefined;
    } | {
        registered: boolean;
        imageHash: string;
        garment: {
            id: string;
            titulo: string;
            marca: string;
            estado: import(".prisma/client").$Enums.GarmentStatus;
            nftTokenId: string;
            imagen: string;
            sellerWallet: string;
            sellerNombre: string;
            verification: {
                authenticityPct: number;
                wearLevel: string;
                dictamen: string;
            };
            createdAt: Date;
        };
    }>;
    findMine(user: {
        userId: string;
    }): Promise<({
        verification: {
            authenticityPct: number;
            wearLevel: string;
        };
    } & {
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
    })[]>;
    update(id: string, dto: UpdateGarmentDto, user: {
        userId: string;
    }): Promise<{
        verification: {
            authenticityPct: number;
            wearLevel: string;
        };
    } & {
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
    }>;
    findAll(dto: ListGarmentsDto): Promise<{
        data: {
            verification: {
                authenticityPct: number;
                wearLevel: string;
            };
            id: string;
            titulo: string;
            marca: string;
            talla: string;
            categoria: string;
            precio: number;
            imagenes: string[];
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
            seller: {
                id: string;
                walletAddress: string;
                nombre: string;
                avatar: string;
            };
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getMetadata(id: string): Promise<{
        name: string;
        description: string;
        image: string;
        external_url: string;
        attributes: ({
            trait_type: string;
            value: string;
            display_type?: undefined;
        } | {
            trait_type: string;
            display_type: string;
            value: string | number;
        })[];
        rewear: {
            garmentId: string;
            nftTokenId: string;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
            verificadoEn: Date;
            dictamen: string;
        };
    }>;
    nftHistory(id: string): Promise<{
        tokenId: string;
        contract: string;
        events: {
            type: "MINT" | "TRANSFER";
            from: string;
            to: string;
            txHash: string;
            blockNumber: number;
            timestamp: number;
        }[];
    }>;
    findOne(id: string): Promise<{
        seller: {
            ratingAvg: number;
            ratingCount: number;
            salesCount: number;
            id: string;
            walletAddress: string;
            nombre: string;
            avatar: string;
        };
        verification: {
            id: string;
            createdAt: Date;
            garmentId: string;
            aiScore: number | null;
            authenticityPct: number | null;
            wearLevel: string | null;
            dictamen: string | null;
        };
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
    }>;
}
