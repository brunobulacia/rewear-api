import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname, join } from 'path';
import { createHash } from 'crypto';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { GarmentsService } from './garments.service';
import { CloudinaryService } from '../storage/cloudinary.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { VerificationService } from '../verification/verification.service';
import { ListGarmentsDto } from './dto/list-garments.dto';
import { CreateGarmentDto } from './dto/create-garment.dto';
import { UpdateGarmentDto } from './dto/update-garment.dto';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('garments')
export class GarmentsController {
  constructor(
    private garmentsService: GarmentsService,
    private cloudinary: CloudinaryService,
    private blockchain: BlockchainService,
    private verificationService: VerificationService,
  ) {}

  /** Sube un archivo a Cloudinary (CDN); si no está activo, guarda en disco local. */
  private async storeImage(file: Express.Multer.File): Promise<string> {
    if (this.cloudinary.isActive) {
      return this.cloudinary.uploadImage(file.buffer);
    }
    const dir = join(process.cwd(), 'uploads');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
    writeFileSync(join(dir, name), file.buffer);
    const apiBase = process.env.API_BASE_URL || 'http://localhost:4000/api';
    return `${apiBase}/uploads/${name}`;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new BadRequestException('Solo se aceptan imágenes'), false);
      },
    }),
  )
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: CreateGarmentDto,
    @CurrentUser() user: { userId: string; walletAddress: string },
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Se requiere al menos una imagen');
    }

    // Huella digital SHA-256 de la primera imagen (trazabilidad / antifalsificación)
    const imageHash = createHash('sha256').update(files[0].buffer).digest('hex');

    // Sube todas las imágenes al CDN (Cloudinary) — URLs absolutas y persistentes
    const imagenes = await Promise.all(files.map((f) => this.storeImage(f)));

    const garment = await this.garmentsService.create(dto, user.userId, imagenes, imageHash);

    // Pipeline asíncrono: visión → aprobación → mint NFT
    this.verificationService.runPipeline(garment.id).catch(() => {});

    return garment;
  }

  /**
   * Verificador de trazabilidad (público): subís una foto y, si ya está
   * registrada en el sistema, devuelve su pasaporte NFT y su hash. No requiere
   * login — cualquiera puede verificar la autenticidad de una prenda.
   */
  @Post('verify-image')
  @UseInterceptors(
    FilesInterceptor('images', 1, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new BadRequestException('Solo se aceptan imágenes'), false);
      },
    }),
  )
  async verifyImage(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Se requiere una imagen para verificar');
    }
    const imageHash = createHash('sha256').update(files[0].buffer).digest('hex');
    return this.garmentsService.verifyByImageHash(imageHash);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: { userId: string }) {
    return this.garmentsService.findByUser(user.userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGarmentDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.garmentsService.update(id, user.userId, dto);
  }

  @Get()
  findAll(@Query() dto: ListGarmentsDto) {
    return this.garmentsService.findAll(dto);
  }

  @Get(':id/metadata')
  getMetadata(@Param('id') id: string) {
    return this.garmentsService.getMetadata(id);
  }

  /**
   * Historial on-chain del pasaporte NFT de una prenda (público):
   * todas las transacciones (mint, ventas, transferencias) por las que pasó.
   */
  @Get(':id/nft-history')
  async nftHistory(@Param('id') id: string) {
    const garment = await this.garmentsService.findOne(id);
    if (!garment.nftTokenId) {
      return { tokenId: null, contract: null, events: [] };
    }
    const events = await this.blockchain.getTokenHistory(garment.nftTokenId);
    const contract = await this.blockchain.getNftContractAddress();
    return { tokenId: garment.nftTokenId, contract, events };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.garmentsService.findOne(id);
  }
}
