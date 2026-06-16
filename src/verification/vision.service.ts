import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

export interface VisionResult {
  /** true solo si la imagen es una prenda de vestir / calzado / accesorio usable */
  isClothing: boolean;
  /** etiqueta de la prenda detectada (ej "Chaqueta de cuero") o motivo del rechazo */
  label: string;
  /** estado de conservación estimado por la IA */
  wearLevel: 'Excelente' | 'Muy bueno' | 'Bueno' | 'Regular' | 'Desconocido';
  /** % de confianza/autenticidad estimado */
  authenticityPct: number;
  /** dictamen legible para mostrar al usuario */
  dictamen: string;
}

const MIME: Record<string, 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

/**
 * Visión por computadora con Claude: clasifica una imagen para garantizar que
 * sea una prenda de vestir antes de aprobarla y mintear su NFT. Si la API no
 * está configurada, hace fail-open (acepta) para no bloquear el flujo en dev.
 */
@Injectable()
export class VisionService {
  private readonly logger = new Logger(VisionService.name);
  private client: Anthropic | null = null;
  private readonly model: string;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('CLAUDE_API_KEY');
    this.model = this.config.get<string>('CLAUDE_VISION_MODEL') || 'claude-opus-4-8';
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
      this.logger.log(`Vision activa con ${this.model}`);
    } else {
      this.logger.warn('CLAUDE_API_KEY no configurada — la verificación visual se salta (fail-open).');
    }
  }

  get isActive(): boolean {
    return this.client !== null;
  }

  /**
   * @param imageUrl URL pública de la imagen (ej http://localhost:4000/api/uploads/abc.png)
   *                 — se resuelve al archivo local en ./uploads.
   */
  async classifyGarment(imageUrl: string): Promise<VisionResult> {
    if (!this.client) {
      return {
        isClothing: true,
        label: 'Sin verificación visual',
        wearLevel: 'Desconocido',
        authenticityPct: 80,
        dictamen: 'Verificación visual no disponible (API no configurada).',
      };
    }

    // La imagen puede estar en el CDN (Cloudinary, URL remota) o en disco local.
    // Para remotas usamos el "image source" por URL de Claude; para locales, base64.
    const filename = imageUrl.split('/uploads/').pop() ?? '';
    const localPath = path.join(process.cwd(), 'uploads', filename);
    const isLocalFile = imageUrl.includes('/uploads/') && fs.existsSync(localPath);
    const isRemote = /^https?:\/\//.test(imageUrl) && !isLocalFile;

    let imageSource: Anthropic.ImageBlockParam['source'];
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
    } else if (isRemote) {
      imageSource = { type: 'url', url: imageUrl };
    } else {
      throw new Error(`Imagen no accesible: ${imageUrl}`);
    }

    const prompt =
      'Analizá esta foto para un marketplace de ropa de segunda mano. ' +
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
    let parsed: Partial<VisionResult>;
    try {
      parsed = JSON.parse(clean);
    } catch {
      this.logger.warn(`Respuesta de visión no parseable: ${text.slice(0, 120)}`);
      throw new Error('La IA de visión no devolvió un resultado válido.');
    }

    return {
      isClothing: parsed.isClothing === true,
      label: parsed.label ?? 'Sin etiqueta',
      wearLevel: (parsed.wearLevel as VisionResult['wearLevel']) ?? 'Bueno',
      authenticityPct: Math.max(0, Math.min(100, Number(parsed.authenticityPct) || 0)),
      dictamen: parsed.dictamen ?? '',
    };
  }
}
