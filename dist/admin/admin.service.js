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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const transactions_service_1 = require("../transactions/transactions.service");
let AdminService = class AdminService {
    constructor(prisma, transactions) {
        this.prisma = prisma;
        this.transactions = transactions;
    }
    async getStats() {
        const [totalUsers, totalGarments, verifiedGarments, activeTransactions, completedTransactions, openDisputes,] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.garment.count(),
            this.prisma.garment.count({ where: { estado: 'VERIFIED' } }),
            this.prisma.transaction.count({ where: { status: 'CONFIRMED' } }),
            this.prisma.transaction.count({ where: { status: 'COMPLETED' } }),
            this.prisma.dispute.count({ where: { status: 'OPEN' } }),
        ]);
        return {
            totalUsers,
            totalGarments,
            verifiedGarments,
            activeTransactions,
            completedTransactions,
            openDisputes,
        };
    }
    async getTransactions(limit = 20) {
        const txs = await this.prisma.transaction.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                garment: { select: { id: true, titulo: true, imagenes: true, precio: true } },
                buyer: { select: { id: true, walletAddress: true, nombre: true } },
                seller: { select: { id: true, walletAddress: true, nombre: true } },
                disputes: { select: { id: true, reason: true, status: true } },
            },
        });
        return txs.map(({ amount, ...tx }) => ({ ...tx, amountMatic: amount }));
    }
    async getDisputes() {
        return this.prisma.dispute.findMany({
            where: { status: 'OPEN' },
            orderBy: { createdAt: 'desc' },
            include: {
                transaction: {
                    include: {
                        garment: { select: { id: true, titulo: true, imagenes: true } },
                        buyer: { select: { id: true, walletAddress: true, nombre: true } },
                        seller: { select: { id: true, walletAddress: true, nombre: true } },
                    },
                },
            },
        });
    }
    async resolveDispute(transactionId, buyerWins) {
        const dispute = await this.prisma.dispute.findFirst({ where: { transactionId } });
        if (!dispute)
            throw new Error('Disputa no encontrada');
        await this.transactions.resolveDispute(transactionId, { buyerWins });
        return { ok: true };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        transactions_service_1.TransactionsService])
], AdminService);
//# sourceMappingURL=admin.service.js.map