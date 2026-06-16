"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var VerificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const blockchain_service_1 = require("../blockchain/blockchain.service");
const vision_service_1 = require("./vision.service");
let VerificationService = VerificationService_1 = class VerificationService {
    constructor(prisma, blockchain, vision, config) {
        this.prisma = prisma;
        this.blockchain = blockchain;
        this.vision = vision;
        this.config = config;
        this.logger = new common_1.Logger(VerificationService_1.name);
    }
    async runPipeline(garmentId) {
        try {
            const garment = await this.markInProgress(garmentId);
            const imageUrl = garment?.imagenes?.[0];
            if (!imageUrl)
                throw new Error('La prenda no tiene imágenes para analizar');
            const result = await this.vision.classifyGarment(imageUrl);
            if (!result.isClothing) {
                await this.saveVerification(garmentId, {
                    aiScore: result.authenticityPct,
                    authenticityPct: result.authenticityPct,
                    wearLevel: result.wearLevel,
                    dictamen: `RECHAZADA: ${result.dictamen || result.label}`,
                });
                await this.prisma.garment.update({
                    where: { id: garmentId },
                    data: { verificationStatus: 'REJECTED', estado: 'REJECTED' },
                });
                this.logger.warn(`Prenda ${garmentId} RECHAZADA por visión: ${result.label}`);
                return;
            }
            await this.saveVerification(garmentId, {
                aiScore: result.authenticityPct,
                authenticityPct: result.authenticityPct,
                wearLevel: result.wearLevel,
                dictamen: result.dictamen,
            });
            await this.approveGarment(garmentId);
            await this.mintNFT(garmentId);
        }
        catch (err) {
            this.logger.error(`Pipeline fallido para prenda ${garmentId}`, err);
            await this.prisma.garment
                .update({
                where: { id: garmentId },
                data: { verificationStatus: 'REJECTED' },
            })
                .catch(() => { });
        }
    }
    async markInProgress(garmentId) {
        const garment = await this.prisma.garment.update({
            where: { id: garmentId },
            data: { verificationStatus: 'IN_PROGRESS' },
        });
        this.logger.log(`Analizando imagen de la prenda ${garmentId} con visión por computadora...`);
        return garment;
    }
    async saveVerification(garmentId, data) {
        await this.prisma.verification.create({
            data: { garmentId, ...data },
        });
    }
    async approveGarment(garmentId) {
        await this.prisma.garment.update({
            where: { id: garmentId },
            data: { verificationStatus: 'APPROVED', estado: 'VERIFIED' },
        });
        this.logger.log(`Prenda ${garmentId} aprobada`);
    }
    async mintNFT(garmentId) {
        const garment = await this.prisma.garment.findUnique({
            where: { id: garmentId },
            include: { seller: true },
        });
        if (!garment)
            return;
        const apiBase = this.config.get('API_BASE_URL') || 'http://localhost:4000/api';
        const tokenURI = `${apiBase}/garments/${garmentId}/metadata`;
        const tokenId = await this.blockchain.mintPassport(garment.seller.walletAddress, garmentId, tokenURI);
        if (tokenId) {
            await this.prisma.garment.update({
                where: { id: garmentId },
                data: { nftTokenId: tokenId },
            });
            this.logger.log(`NFT #${tokenId} registrado para prenda ${garmentId}`);
        }
    }
};
exports.VerificationService = VerificationService;
exports.VerificationService = VerificationService = VerificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        blockchain_service_1.BlockchainService,
        vision_service_1.VisionService,
        config_1.ConfigService])
], VerificationService);
//# sourceMappingURL=verification.service.js.map