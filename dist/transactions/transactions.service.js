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
var TransactionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const blockchain_service_1 = require("../blockchain/blockchain.service");
let TransactionsService = TransactionsService_1 = class TransactionsService {
    constructor(prisma, blockchain) {
        this.prisma = prisma;
        this.blockchain = blockchain;
        this.logger = new common_1.Logger(TransactionsService_1.name);
    }
    async create(dto, buyerId) {
        const garment = await this.prisma.garment.findUnique({
            where: { id: dto.garmentId },
        });
        if (!garment)
            throw new common_1.NotFoundException('Prenda no encontrada');
        if (garment.estado !== 'VERIFIED') {
            throw new common_1.BadRequestException('La prenda no está verificada o ya fue vendida');
        }
        if (garment.sellerId === buyerId) {
            throw new common_1.BadRequestException('No podés comprar tu propia prenda');
        }
        const existing = await this.prisma.transaction.findFirst({
            where: { garmentId: dto.garmentId, status: { in: ['PENDING', 'CONFIRMED'] } },
        });
        if (existing)
            throw new common_1.BadRequestException('La prenda ya tiene una transacción activa');
        const transaction = await this.prisma.transaction.create({
            data: {
                buyerId,
                sellerId: garment.sellerId,
                garmentId: dto.garmentId,
                amount: dto.amountMatic,
                escrowTxHash: dto.escrowTxHash,
                escrowTradeId: dto.escrowTradeId,
                status: 'CONFIRMED',
            },
            include: { buyer: true, seller: true, garment: true },
        });
        await this.prisma.garment.update({
            where: { id: dto.garmentId },
            data: { estado: 'PENDING' },
        });
        this.logger.log(`Transacción creada: ${transaction.id} para prenda ${dto.garmentId}`);
        return transaction;
    }
    async confirmDelivery(transactionId, dto, userId) {
        const tx = await this.getOrThrow(transactionId);
        if (tx.buyerId !== userId)
            throw new common_1.ForbiddenException('Solo el comprador puede confirmar');
        if (tx.status !== 'CONFIRMED') {
            throw new common_1.BadRequestException(`Estado inválido: ${tx.status}`);
        }
        const updated = await this.prisma.transaction.update({
            where: { id: transactionId },
            data: { status: 'COMPLETED', escrowTxHash: dto.txHash },
            include: { buyer: true, seller: true, garment: true },
        });
        await this.prisma.garment.update({
            where: { id: tx.garmentId },
            data: { estado: 'SOLD' },
        });
        const nftTokenId = tx.garment.nftTokenId;
        if (nftTokenId) {
            this.blockchain
                .transferPassport(tx.buyer.walletAddress, nftTokenId)
                .catch((err) => this.logger.error('Error transfiriendo NFT', err));
        }
        this.logger.log(`Entrega confirmada: tx ${transactionId}`);
        return updated;
    }
    async openDispute(transactionId, dto, userId) {
        const tx = await this.getOrThrow(transactionId);
        if (tx.buyerId !== userId)
            throw new common_1.ForbiddenException('Solo el comprador puede disputar');
        if (tx.status !== 'CONFIRMED') {
            throw new common_1.BadRequestException(`Estado inválido: ${tx.status}`);
        }
        await this.prisma.dispute.create({
            data: {
                transactionId,
                openedById: userId,
                reason: dto.reason?.trim() || 'Disputa abierta por el comprador',
                status: 'OPEN',
            },
        });
        const updated = await this.prisma.transaction.update({
            where: { id: transactionId },
            data: { status: 'DISPUTED' },
            include: { buyer: true, seller: true, garment: true },
        });
        this.logger.log(`Disputa abierta en tx ${transactionId}`);
        return updated;
    }
    async cancelPurchase(transactionId, dto, userId) {
        const tx = await this.getOrThrow(transactionId);
        if (tx.buyerId !== userId)
            throw new common_1.ForbiddenException('Solo el comprador puede cancelar');
        if (tx.status !== 'CONFIRMED') {
            throw new common_1.BadRequestException('Solo se puede cancelar una compra pendiente de confirmación');
        }
        if (tx.escrowTradeId) {
            const ok = await this.blockchain.resolveDispute(tx.escrowTradeId, true);
            if (!ok) {
                throw new common_1.BadRequestException('No se pudo reembolsar on-chain. Tenés que firmar la cancelación en tu billetera primero.');
            }
        }
        await this.prisma.dispute.updateMany({
            where: { transactionId, status: 'OPEN' },
            data: { status: 'RESOLVED', resolution: 'Compra cancelada por el comprador' },
        });
        const updated = await this.prisma.transaction.update({
            where: { id: transactionId },
            data: { status: 'REFUNDED' },
            include: { buyer: true, seller: true, garment: true },
        });
        await this.prisma.garment.update({
            where: { id: tx.garmentId },
            data: { estado: 'VERIFIED' },
        });
        this.logger.log(`Compra cancelada y reembolsada: tx ${transactionId}`);
        return updated;
    }
    async resolveDispute(transactionId, dto) {
        const tx = await this.getOrThrow(transactionId);
        if (tx.status !== 'DISPUTED') {
            throw new common_1.BadRequestException('La transacción no está en disputa');
        }
        if (tx.escrowTradeId) {
            const ok = await this.blockchain.resolveDispute(tx.escrowTradeId, dto.buyerWins);
            if (!ok) {
                throw new common_1.BadRequestException('No se pudo resolver la disputa on-chain. La disputa debe estar abierta en el contrato (firmada por el comprador).');
            }
        }
        const newStatus = dto.buyerWins ? 'REFUNDED' : 'COMPLETED';
        await this.prisma.dispute.updateMany({
            where: { transactionId, status: 'OPEN' },
            data: {
                status: 'RESOLVED',
                resolution: dto.buyerWins ? 'Reembolso al comprador' : 'Fondos liberados al vendedor',
            },
        });
        const updated = await this.prisma.transaction.update({
            where: { id: transactionId },
            data: { status: newStatus },
            include: { buyer: true, seller: true, garment: true },
        });
        if (!dto.buyerWins) {
            await this.prisma.garment.update({
                where: { id: tx.garmentId },
                data: { estado: 'SOLD' },
            });
            if (tx.garment.nftTokenId) {
                this.blockchain
                    .transferPassport(tx.buyer.walletAddress, tx.garment.nftTokenId)
                    .catch((err) => this.logger.error('Error transfiriendo NFT en resolución', err));
            }
        }
        else {
            await this.prisma.garment.update({
                where: { id: tx.garmentId },
                data: { estado: 'VERIFIED' },
            });
        }
        this.logger.log(`Disputa resuelta en tx ${transactionId} — buyerWins: ${dto.buyerWins}`);
        return updated;
    }
    async findMine(userId) {
        const txs = await this.prisma.transaction.findMany({
            where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
            include: {
                garment: { select: { id: true, titulo: true, imagenes: true, precio: true, marca: true, talla: true } },
                buyer: { select: { id: true, walletAddress: true, nombre: true } },
                seller: { select: { id: true, walletAddress: true, nombre: true } },
                disputes: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
            orderBy: { createdAt: 'desc' },
        });
        return txs.map(({ amount, disputes, ...tx }) => ({
            ...tx,
            amountMatic: amount,
            dispute: disputes[0] ?? null,
        }));
    }
    async findOne(transactionId, userId) {
        const tx = await this.getOrThrow(transactionId);
        if (tx.buyerId !== userId && tx.sellerId !== userId) {
            throw new common_1.ForbiddenException('No tenés acceso a esta transacción');
        }
        return tx;
    }
    async getOrThrow(transactionId) {
        const tx = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
            include: {
                garment: true,
                buyer: true,
                seller: true,
                disputes: true,
            },
        });
        if (!tx)
            throw new common_1.NotFoundException('Transacción no encontrada');
        return tx;
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = TransactionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        blockchain_service_1.BlockchainService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map