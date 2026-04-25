import { PrismaService } from '../prisma/prisma.service';
import { ListGarmentsDto } from './dto/list-garments.dto';
import { CreateGarmentDto } from './dto/create-garment.dto';
export declare class GarmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateGarmentDto, sellerId: string, imagenes: string[]): Promise<{
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
        imagenes: string[];
        nftTokenId: string | null;
        verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        sellerId: string;
    }>;
    findAll(dto: ListGarmentsDto): Promise<{
        data: {
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
            verification: {
                authenticityPct: number;
                wearLevel: string;
            };
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        seller: {
            id: string;
            walletAddress: string;
            nombre: string;
            avatar: string;
        };
        verification: {
            id: string;
            createdAt: Date;
            aiScore: number | null;
            authenticityPct: number | null;
            wearLevel: string | null;
            dictamen: string | null;
            garmentId: string;
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
        imagenes: string[];
        nftTokenId: string | null;
        verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        sellerId: string;
    }>;
    findByUser(sellerId: string): Promise<({
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
        imagenes: string[];
        nftTokenId: string | null;
        verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        sellerId: string;
    })[]>;
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
}
