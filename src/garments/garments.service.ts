import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListGarmentsDto } from './dto/list-garments.dto';
import { CreateGarmentDto } from './dto/create-garment.dto';
import { UpdateGarmentDto } from './dto/update-garment.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class GarmentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    dto: CreateGarmentDto,
    sellerId: string,
    imagenes: string[],
    imageHash?: string,
  ) {
    return this.prisma.garment.create({
      data: {
        ...dto,
        sellerId,
        imagenes,
        imageHash,
        verificationStatus: 'PENDING',
        estado: 'PENDING',
      },
      include: {
        seller: {
          select: { id: true, walletAddress: true, nombre: true, avatar: true },
        },
      },
    });
  }

  /**
   * Trazabilidad de imágenes: busca si una foto (por su hash SHA-256) ya está
   * registrada en el sistema y, de estarlo, devuelve su pasaporte NFT.
   */
  async verifyByImageHash(imageHash: string) {
    const garment = await this.prisma.garment.findFirst({
      where: { imageHash },
      include: {
        seller: { select: { walletAddress: true, nombre: true } },
        verification: { select: { wearLevel: true, authenticityPct: true, dictamen: true } },
      },
    });

    if (!garment) {
      return { registered: false, imageHash };
    }

    return {
      registered: true,
      imageHash,
      garment: {
        id: garment.id,
        titulo: garment.titulo,
        marca: garment.marca,
        estado: garment.estado,
        nftTokenId: garment.nftTokenId,
        imagen: garment.imagenes?.[0] ?? null,
        sellerWallet: garment.seller?.walletAddress ?? null,
        sellerNombre: garment.seller?.nombre ?? null,
        verification: garment.verification ?? null,
        createdAt: garment.createdAt,
      },
    };
  }

  async findAll(dto: ListGarmentsDto) {
    const { marca, talla, categoria, precioMin, precioMax, q, sort = 'recent', page = 1, limit = 12 } = dto;

    const orderBy: Prisma.GarmentOrderByWithRelationInput =
      sort === 'price_asc'    ? { precio: 'asc' }
      : sort === 'price_desc' ? { precio: 'desc' }
      : { createdAt: 'desc' };

    const where: Prisma.GarmentWhereInput = {
      estado: 'VERIFIED',
      ...(marca && { marca: { contains: marca, mode: 'insensitive' } }),
      ...(talla && { talla }),
      ...(categoria && { categoria: { contains: categoria, mode: 'insensitive' } }),
      ...(q && {
        OR: [
          { titulo: { contains: q, mode: 'insensitive' } },
          { descripcion: { contains: q, mode: 'insensitive' } },
          { marca: { contains: q, mode: 'insensitive' } },
        ],
      }),
      ...((precioMin !== undefined || precioMax !== undefined) && {
        precio: {
          ...(precioMin !== undefined && { gte: precioMin }),
          ...(precioMax !== undefined && { lte: precioMax }),
        },
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.garment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        select: {
          id: true,
          titulo: true,
          precio: true,
          marca: true,
          talla: true,
          categoria: true,
          imagenes: true,
          verificationStatus: true,
          seller: {
            select: { id: true, walletAddress: true, nombre: true, avatar: true },
          },
          verification: {
            select: { wearLevel: true, authenticityPct: true },
          },
        },
      }),
      this.prisma.garment.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const garment = await this.prisma.garment.findUnique({
      where: { id },
      include: {
        seller: {
          select: { id: true, walletAddress: true, nombre: true, avatar: true },
        },
        verification: true,
      },
    });

    if (!garment) throw new NotFoundException('Prenda no encontrada');

    // Reputación del vendedor (promedio de estrellas, nº de reseñas y ventas).
    const [agg, salesCount] = await Promise.all([
      this.prisma.rating.aggregate({
        where: { toUserId: garment.sellerId },
        _avg: { score: true },
        _count: true,
      }),
      this.prisma.transaction.count({
        where: { sellerId: garment.sellerId, status: 'COMPLETED' },
      }),
    ]);

    return {
      ...garment,
      seller: {
        ...garment.seller,
        ratingAvg: agg._avg.score,
        ratingCount: agg._count,
        salesCount,
      },
    };
  }

  /**
   * Actualiza campos editables de una prenda (precio, título, etc.).
   * Solo el dueño (vendedor) puede editarla. El NFT no se ve afectado:
   * el precio vive off-chain.
   */
  async update(id: string, sellerId: string, dto: UpdateGarmentDto) {
    const garment = await this.prisma.garment.findUnique({ where: { id } });
    if (!garment) throw new NotFoundException('Prenda no encontrada');
    if (garment.sellerId !== sellerId) {
      throw new ForbiddenException('No podés editar una prenda que no es tuya');
    }

    return this.prisma.garment.update({
      where: { id },
      data: { ...dto },
      include: {
        verification: { select: { wearLevel: true, authenticityPct: true } },
      },
    });
  }

  async findByUser(sellerId: string) {
    return this.prisma.garment.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      include: {
        verification: {
          select: { wearLevel: true, authenticityPct: true },
        },
      },
    });
  }

  async getMetadata(id: string) {
    const garment = await this.prisma.garment.findUnique({
      where: { id },
      include: {
        seller: { select: { walletAddress: true, nombre: true } },
        verification: true,
      },
    });

    if (!garment) throw new NotFoundException('Prenda no encontrada');

    return {
      name: garment.titulo,
      description: garment.descripcion || `Prenda verificada por ReWear: ${garment.titulo}`,
      image: garment.imagenes[0] || '',
      external_url: `http://localhost:3000/garment/${garment.id}`,
      attributes: [
        { trait_type: 'Marca', value: garment.marca || 'Sin marca' },
        { trait_type: 'Talla', value: garment.talla || 'Única' },
        { trait_type: 'Categoría', value: garment.categoria || 'Otros' },
        { trait_type: 'Estado', value: garment.verification?.wearLevel || 'Verificado' },
        {
          trait_type: 'Autenticidad',
          value: garment.verification?.authenticityPct?.toFixed(1) + '%' || '—',
        },
        {
          trait_type: 'AI Score',
          display_type: 'number',
          value: garment.verification?.aiScore?.toFixed(1) || 0,
        },
        { trait_type: 'Vendedor', value: garment.seller.nombre || garment.seller.walletAddress },
        { trait_type: 'Plataforma', value: 'ReWear' },
        { trait_type: 'Red', value: 'Ethereum Sepolia' },
      ],
      rewear: {
        garmentId: garment.id,
        nftTokenId: garment.nftTokenId,
        verificationStatus: garment.verificationStatus,
        verificadoEn: garment.verification?.createdAt,
        dictamen: garment.verification?.dictamen,
      },
    };
  }
}
