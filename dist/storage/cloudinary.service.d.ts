import { ConfigService } from '@nestjs/config';
export declare class CloudinaryService {
    private config;
    private readonly logger;
    private active;
    constructor(config: ConfigService);
    get isActive(): boolean;
    uploadImage(buffer: Buffer, folder?: string): Promise<string>;
}
