import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { VisionService } from './vision.service';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private prisma: PrismaService,
    private blockchain: BlockchainService,
    private vision: VisionService,
    private config: ConfigService,
  ) {}

  /**
   * Pipeline completo: VISIÓN (¿es ropa?) → aprobación → mint NFT.
   * Si la imagen no es una prenda, se RECHAZA y no se mintea nada.
   * Se llama de forma asíncrona (fire-and-forget) desde el controller.
   */
  async runPipeline(garmentId: string): Promise<void> {
    try {
      const garment = await this.markInProgress(garmentId);
      const imageUrl = garment?.imagenes?.[0];
      if (!imageUrl) throw new Error('La prenda no tiene imágenes para analizar');

      // 1) Visión por computadora: clasifica la imagen con Claude
      const result = await this.vision.classifyGarment(imageUrl);

      if (!result.isClothing) {
        // No es una prenda → rechazo, sin mint
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

      // 2) Es ropa → guarda dictamen real, aprueba y mintea
      await this.saveVerification(garmentId, {
        aiScore: result.authenticityPct,
        authenticityPct: result.authenticityPct,
        wearLevel: result.wearLevel,
        dictamen: result.dictamen,
      });
      await this.approveGarment(garmentId);
      await this.mintNFT(garmentId);
    } catch (err) {
      this.logger.error(`Pipeline fallido para prenda ${garmentId}`, err);
      await this.prisma.garment
        .update({
          where: { id: garmentId },
          data: { verificationStatus: 'REJECTED' },
        })
        .catch(() => {});
    }
  }

  private async markInProgress(garmentId: string) {
    const garment = await this.prisma.garment.update({
      where: { id: garmentId },
      data: { verificationStatus: 'IN_PROGRESS' },
    });
    this.logger.log(`Analizando imagen de la prenda ${garmentId} con visión por computadora...`);
    return garment;
  }

  private async saveVerification(
    garmentId: string,
    data: { aiScore: number; authenticityPct: number; wearLevel: string; dictamen: string },
  ) {
    await this.prisma.verification.create({
      data: { garmentId, ...data },
    });
  }

  private async approveGarment(garmentId: string) {
    await this.prisma.garment.update({
      where: { id: garmentId },
      data: { verificationStatus: 'APPROVED', estado: 'VERIFIED' },
    });
    this.logger.log(`Prenda ${garmentId} aprobada`);
  }

  private async mintNFT(garmentId: string) {
    const garment = await this.prisma.garment.findUnique({
      where: { id: garmentId },
      include: { seller: true },
    });
    if (!garment) return;

    const apiBase =
      this.config.get<string>('API_BASE_URL') || 'http://localhost:4000/api';
    const tokenURI = `${apiBase}/garments/${garmentId}/metadata`;

    const tokenId = await this.blockchain.mintPassport(
      garment.seller.walletAddress,
      garmentId,
      tokenURI,
    );

    if (tokenId) {
      await this.prisma.garment.update({
        where: { id: garmentId },
        data: { nftTokenId: tokenId },
      });
      this.logger.log(`NFT #${tokenId} registrado para prenda ${garmentId}`);
    }
  }
}
