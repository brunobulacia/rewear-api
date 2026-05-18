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
exports.RatingsService = exports.CreateRatingDto = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
class CreateRatingDto {
}
exports.CreateRatingDto = CreateRatingDto;
let RatingsService = class RatingsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, fromUserId) {
        if (dto.score < 1 || dto.score > 5) {
            throw new common_1.BadRequestException('Score debe ser entre 1 y 5');
        }
        const tx = await this.prisma.transaction.findUnique({
            where: { id: dto.transactionId },
            select: { buyerId: true, sellerId: true, status: true },
        });
        if (!tx)
            throw new common_1.NotFoundException('Transacción no encontrada');
        if (tx.buyerId !== fromUserId)
            throw new common_1.ForbiddenException('Solo el comprador puede calificar');
        if (tx.status !== 'COMPLETED')
            throw new common_1.BadRequestException('Solo se puede calificar transacciones completadas');
        const existing = await this.prisma.rating.findFirst({
            where: { transactionId: dto.transactionId, fromUserId },
        });
        if (existing)
            throw new common_1.BadRequestException('Ya calificaste esta transacción');
        return this.prisma.rating.create({
            data: {
                transactionId: dto.transactionId,
                fromUserId,
                toUserId: tx.sellerId,
                score: dto.score,
                comment: dto.comment,
            },
        });
    }
    async getByUser(userId) {
        const ratings = await this.prisma.rating.findMany({
            where: { toUserId: userId },
            orderBy: { createdAt: 'desc' },
            include: {
                fromUser: { select: { id: true, nombre: true, walletAddress: true } },
                transaction: {
                    include: {
                        garment: { select: { id: true, titulo: true, imagenes: true } },
                    },
                },
            },
        });
        const avg = ratings.length
            ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
            : null;
        return { ratings, avg, total: ratings.length };
    }
    async getByTransaction(transactionId) {
        return this.prisma.rating.findFirst({ where: { transactionId } });
    }
};
exports.RatingsService = RatingsService;
exports.RatingsService = RatingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RatingsService);
//# sourceMappingURL=ratings.service.js.map