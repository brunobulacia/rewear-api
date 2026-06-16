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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GarmentsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const garments_service_1 = require("./garments.service");
const cloudinary_service_1 = require("../storage/cloudinary.service");
const blockchain_service_1 = require("../blockchain/blockchain.service");
const verification_service_1 = require("../verification/verification.service");
const list_garments_dto_1 = require("./dto/list-garments.dto");
const create_garment_dto_1 = require("./dto/create-garment.dto");
const update_garment_dto_1 = require("./dto/update-garment.dto");
const jwt_auth_guard_1 = require("../common/jwt-auth.guard");
const current_user_decorator_1 = require("../common/current-user.decorator");
let GarmentsController = class GarmentsController {
    constructor(garmentsService, cloudinary, blockchain, verificationService) {
        this.garmentsService = garmentsService;
        this.cloudinary = cloudinary;
        this.blockchain = blockchain;
        this.verificationService = verificationService;
    }
    async storeImage(file) {
        if (this.cloudinary.isActive) {
            return this.cloudinary.uploadImage(file.buffer);
        }
        const dir = (0, path_1.join)(process.cwd(), 'uploads');
        if (!(0, fs_1.existsSync)(dir))
            (0, fs_1.mkdirSync)(dir, { recursive: true });
        const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${(0, path_1.extname)(file.originalname)}`;
        (0, fs_1.writeFileSync)((0, path_1.join)(dir, name), file.buffer);
        const apiBase = process.env.API_BASE_URL || 'http://localhost:4000/api';
        return `${apiBase}/uploads/${name}`;
    }
    async create(files, dto, user) {
        if (!files || files.length === 0) {
            throw new common_1.BadRequestException('Se requiere al menos una imagen');
        }
        const imageHash = (0, crypto_1.createHash)('sha256').update(files[0].buffer).digest('hex');
        const imagenes = await Promise.all(files.map((f) => this.storeImage(f)));
        const garment = await this.garmentsService.create(dto, user.userId, imagenes, imageHash);
        this.verificationService.runPipeline(garment.id).catch(() => { });
        return garment;
    }
    async verifyImage(files) {
        if (!files || files.length === 0) {
            throw new common_1.BadRequestException('Se requiere una imagen para verificar');
        }
        const imageHash = (0, crypto_1.createHash)('sha256').update(files[0].buffer).digest('hex');
        return this.garmentsService.verifyByImageHash(imageHash);
    }
    findMine(user) {
        return this.garmentsService.findByUser(user.userId);
    }
    update(id, dto, user) {
        return this.garmentsService.update(id, user.userId, dto);
    }
    findAll(dto) {
        return this.garmentsService.findAll(dto);
    }
    getMetadata(id) {
        return this.garmentsService.getMetadata(id);
    }
    async nftHistory(id) {
        const garment = await this.garmentsService.findOne(id);
        if (!garment.nftTokenId) {
            return { tokenId: null, contract: null, events: [] };
        }
        const events = await this.blockchain.getTokenHistory(garment.nftTokenId);
        const contract = await this.blockchain.getNftContractAddress();
        return { tokenId: garment.nftTokenId, contract, events };
    }
    findOne(id) {
        return this.garmentsService.findOne(id);
    }
};
exports.GarmentsController = GarmentsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('images', 5, {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_, file, cb) => {
            if (file.mimetype.startsWith('image/'))
                cb(null, true);
            else
                cb(new common_1.BadRequestException('Solo se aceptan imágenes'), false);
        },
    })),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, create_garment_dto_1.CreateGarmentDto, Object]),
    __metadata("design:returntype", Promise)
], GarmentsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('verify-image'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('images', 1, {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_, file, cb) => {
            if (file.mimetype.startsWith('image/'))
                cb(null, true);
            else
                cb(new common_1.BadRequestException('Solo se aceptan imágenes'), false);
        },
    })),
    __param(0, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], GarmentsController.prototype, "verifyImage", null);
__decorate([
    (0, common_1.Get)('mine'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GarmentsController.prototype, "findMine", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_garment_dto_1.UpdateGarmentDto, Object]),
    __metadata("design:returntype", void 0)
], GarmentsController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_garments_dto_1.ListGarmentsDto]),
    __metadata("design:returntype", void 0)
], GarmentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id/metadata'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GarmentsController.prototype, "getMetadata", null);
__decorate([
    (0, common_1.Get)(':id/nft-history'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GarmentsController.prototype, "nftHistory", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GarmentsController.prototype, "findOne", null);
exports.GarmentsController = GarmentsController = __decorate([
    (0, common_1.Controller)('garments'),
    __metadata("design:paramtypes", [garments_service_1.GarmentsService,
        cloudinary_service_1.CloudinaryService,
        blockchain_service_1.BlockchainService,
        verification_service_1.VerificationService])
], GarmentsController);
//# sourceMappingURL=garments.controller.js.map