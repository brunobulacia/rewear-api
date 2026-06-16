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
exports.FavoritesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FavoritesService = class FavoritesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async toggle(userId, garmentId) {
        const existing = await this.prisma.favorite.findUnique({
            where: { userId_garmentId: { userId, garmentId } },
        });
        if (existing) {
            await this.prisma.favorite.delete({ where: { id: existing.id } });
            return { favorited: false };
        }
        await this.prisma.favorite.create({ data: { userId, garmentId } });
        return { favorited: true };
    }
    async findMine(userId) {
        const favs = await this.prisma.favorite.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                garment: {
                    include: {
                        seller: { select: { id: true, nombre: true, walletAddress: true } },
                        verification: { select: { wearLevel: true, authenticityPct: true } },
                    },
                },
            },
        });
        return favs.map((f) => f.garment);
    }
    async myIds(userId) {
        const favs = await this.prisma.favorite.findMany({
            where: { userId },
            select: { garmentId: true },
        });
        return favs.map((f) => f.garmentId);
    }
};
exports.FavoritesService = FavoritesService;
exports.FavoritesService = FavoritesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FavoritesService);
//# sourceMappingURL=favorites.service.js.map