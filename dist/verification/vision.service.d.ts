import { ConfigService } from '@nestjs/config';
export interface VisionResult {
    isClothing: boolean;
    label: string;
    wearLevel: 'Excelente' | 'Muy bueno' | 'Bueno' | 'Regular' | 'Desconocido';
    authenticityPct: number;
    dictamen: string;
}
export declare class VisionService {
    private config;
    private readonly logger;
    private client;
    private readonly model;
    constructor(config: ConfigService);
    get isActive(): boolean;
    classifyGarment(imageUrl: string): Promise<VisionResult>;
}
