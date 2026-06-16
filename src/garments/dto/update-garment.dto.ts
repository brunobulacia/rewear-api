import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Campos editables de una prenda ya publicada. Todos opcionales:
 * se actualiza solo lo que venga en el body. El precio es off-chain
 * (vive en PostgreSQL), así que se puede editar aunque el NFT ya esté minteado.
 */
export class UpdateGarmentDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  precio?: number;

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsString()
  talla?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  estilo?: string;
}
