import { FavoritesService } from './favorites.service';
export declare class FavoritesController {
    private readonly service;
    constructor(service: FavoritesService);
    toggle(garmentId: string, user: {
        userId: string;
    }): Promise<{
        favorited: boolean;
    }>;
    findMine(user: {
        userId: string;
    }): Promise<({
        verification: {
            authenticityPct: number;
            wearLevel: string;
        };
        seller: {
            id: string;
            walletAddress: string;
            nombre: string;
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
    myIds(user: {
        userId: string;
    }): Promise<string[]>;
}
