import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

/**
 * Sube imágenes a Cloudinary (CDN). Devuelve la URL segura y absoluta, que
 * persiste entre deploys (a diferencia del disco efímero de Railway).
 * Si CLOUDINARY_URL no está configurado, queda inactivo y el caller hace fallback.
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private active = false;

  constructor(private config: ConfigService) {
    const url = this.config.get<string>('CLOUDINARY_URL');
    if (url) {
      // El SDK lee CLOUDINARY_URL del entorno automáticamente; configuramos explícito por las dudas.
      cloudinary.config({ secure: true });
      this.active = true;
      this.logger.log('Cloudinary activo');
    } else {
      this.logger.warn('CLOUDINARY_URL no configurado — se usa disco local.');
    }
  }

  get isActive(): boolean {
    return this.active;
  }

  /** Sube un buffer de imagen y devuelve la URL del CDN. */
  uploadImage(buffer: Buffer, folder = 'rewear/garments'): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (err, result) => {
          if (err || !result) return reject(err ?? new Error('Cloudinary sin respuesta'));
          resolve(result.secure_url);
        },
      );
      stream.end(buffer);
    });
  }
}
