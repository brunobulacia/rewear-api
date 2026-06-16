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
var VisionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sdk_1 = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");
const MIME = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
};
let VisionService = VisionService_1 = class VisionService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(VisionService_1.name);
        this.client = null;
        const apiKey = this.config.get('CLAUDE_API_KEY');
        this.model = this.config.get('CLAUDE_VISION_MODEL') || 'claude-opus-4-8';
        if (apiKey) {
            this.client = new sdk_1.default({ apiKey });
            this.logger.log(`Vision activa con ${this.model}`);
        }
        else {
            this.logger.warn('CLAUDE_API_KEY no configurada — la verificación visual se salta (fail-open).');
        }
    }
    get isActive() {
        return this.client !== null;
    }
    async classifyGarment(imageUrl) {
        if (!this.client) {
            return {
                isClothing: true,
                label: 'Sin verificación visual',
                wearLevel: 'Desconocido',
                authenticityPct: 80,
                dictamen: 'Verificación visual no disponible (API no configurada).',
            };
        }
        const filename = imageUrl.split('/uploads/').pop() ?? '';
        const localPath = path.join(process.cwd(), 'uploads', filename);
        const isLocalFile = imageUrl.includes('/uploads/') && fs.existsSync(localPath);
        const isRemote = /^https?:\/\//.test(imageUrl) && !isLocalFile;
        let imageSource;
        if (isLocalFile) {
            const ext = path.extname(filename).toLowerCase();
            const mediaType = MIME[ext];
            if (!mediaType) {
                return {
                    isClothing: false,
                    label: `Formato no soportado (${ext})`,
                    wearLevel: 'Desconocido',
                    authenticityPct: 0,
                    dictamen: 'El archivo no es una imagen válida (JPEG, PNG, WEBP o GIF).',
                };
            }
            const base64 = fs.readFileSync(localPath).toString('base64');
            imageSource = { type: 'base64', media_type: mediaType, data: base64 };
        }
        else if (isRemote) {
            imageSource = { type: 'url', url: imageUrl };
        }
        else {
            throw new Error(`Imagen no accesible: ${imageUrl}`);
        }
        const prompt = 'Analizá esta foto para un marketplace de ropa de segunda mano. ' +
            'Determiná si la imagen muestra UNA PRENDA DE VESTIR, calzado o accesorio de moda usable ' +
            '(ej: remera, pantalón, vestido, chaqueta, zapatillas, cartera, gorra). ' +
            'NO son prendas: personas sin ropa destacada, paisajes, comida, animales, autos, ' +
            'electrónicos, capturas de pantalla, memes o cualquier objeto que no sea ropa. ' +
            'Si ES una prenda, estimá su estado de conservación y un porcentaje de autenticidad/calidad. ' +
            'Respondé SOLO con un objeto JSON válido, sin markdown:\n' +
            '{"isClothing": boolean, "label": "<prenda detectada o motivo del rechazo>", ' +
            '"wearLevel": "Excelente|Muy bueno|Bueno|Regular", ' +
            '"authenticityPct": <0-100>, "dictamen": "<una frase explicando el veredicto>"}';
        const res = await this.client.messages.create({
            model: this.model,
            max_tokens: 512,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'image', source: imageSource },
                        { type: 'text', text: prompt },
                    ],
                },
            ],
        });
        const text = res.content.find((b) => b.type === 'text')?.text ?? '';
        const clean = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
        let parsed;
        try {
            parsed = JSON.parse(clean);
        }
        catch {
            this.logger.warn(`Respuesta de visión no parseable: ${text.slice(0, 120)}`);
            throw new Error('La IA de visión no devolvió un resultado válido.');
        }
        return {
            isClothing: parsed.isClothing === true,
            label: parsed.label ?? 'Sin etiqueta',
            wearLevel: parsed.wearLevel ?? 'Bueno',
            authenticityPct: Math.max(0, Math.min(100, Number(parsed.authenticityPct) || 0)),
            dictamen: parsed.dictamen ?? '',
        };
    }
};
exports.VisionService = VisionService;
exports.VisionService = VisionService = VisionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], VisionService);
//# sourceMappingURL=vision.service.js.map