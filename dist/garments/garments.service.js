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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GarmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let GarmentsService = class GarmentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, sellerId, imagenes, imageHash) {
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
    async verifyByImageHash(imageHash) {
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
    async findAll(dto) {
        const { marca, talla, categoria, precioMin, precioMax, q, page = 1, limit = 12 } = dto;
        const where = {
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
                orderBy: { createdAt: 'desc' },
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
    async findOne(id) {
        const garment = await this.prisma.garment.findUnique({
            where: { id },
            include: {
                seller: {
                    select: { id: true, walletAddress: true, nombre: true, avatar: true },
                },
                verification: true,
            },
        });
        if (!garment)
            throw new common_1.NotFoundException('Prenda no encontrada');
        return garment;
    }
    async update(id, sellerId, dto) {
        const garment = await this.prisma.garment.findUnique({ where: { id } });
        if (!garment)
            throw new common_1.NotFoundException('Prenda no encontrada');
        if (garment.sellerId !== sellerId) {
            throw new common_1.ForbiddenException('No podés editar una prenda que no es tuya');
        }
        return this.prisma.garment.update({
            where: { id },
            data: { ...dto },
            include: {
                verification: { select: { wearLevel: true, authenticityPct: true } },
            },
        });
    }
    async findByUser(sellerId) {
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
    async getMetadata(id) {
        const garment = await this.prisma.garment.findUnique({
            where: { id },
            include: {
                seller: { select: { walletAddress: true, nombre: true } },
                verification: true,
            },
        });
        if (!garment)
            throw new common_1.NotFoundException('Prenda no encontrada');
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
};
exports.GarmentsService = GarmentsService;
exports.GarmentsService = GarmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GarmentsService);
//# sourceMappingURL=garments.service.js.map