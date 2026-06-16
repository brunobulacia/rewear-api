import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { VisionService } from './vision.service';
export declare class VerificationService {
    private prisma;
    private blockchain;
    private vision;
    private config;
    private readonly logger;
    constructor(prisma: PrismaService, blockchain: BlockchainService, vision: VisionService, config: ConfigService);
    runPipeline(garmentId: string): Promise<void>;
    private markInProgress;
    private saveVerification;
    private approveGarment;
    private mintNFT;
}
