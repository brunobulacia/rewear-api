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
exports.RatingsController = void 0;
const common_1 = require("@nestjs/common");
const ratings_service_1 = require("./ratings.service");
const jwt_auth_guard_1 = require("../common/jwt-auth.guard");
const current_user_decorator_1 = require("../common/current-user.decorator");
let RatingsController = class RatingsController {
    constructor(service) {
        this.service = service;
    }
    create(dto, user) {
        return this.service.create(dto, user.userId);
    }
    getByUser(userId) {
        return this.service.getByUser(userId);
    }
    getByTransaction(transactionId) {
        return this.service.getByTransaction(transactionId);
    }
};
exports.RatingsController = RatingsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ratings_service_1.CreateRatingDto, Object]),
    __metadata("design:returntype", void 0)
], RatingsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RatingsController.prototype, "getByUser", null);
__decorate([
    (0, common_1.Get)('transaction/:transactionId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('transactionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RatingsController.prototype, "getByTransaction", null);
exports.RatingsController = RatingsController = __decorate([
    (0, common_1.Controller)('ratings'),
    __metadata("design:paramtypes", [ratings_service_1.RatingsService])
], RatingsController);
//# sourceMappingURL=ratings.controller.js.map