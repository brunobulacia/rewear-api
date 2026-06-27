import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Categoria } from '../categoria';

/**
 * Campos editables de un producto ya publicado. Todos opcionales:
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
  modelo?: string;

  @IsOptional()
  @IsString()
  colorway?: string;

  @IsOptional()
  @IsString()
  talla?: string;

  @IsOptional()
  @IsEnum(Categoria)
  categoria?: Categoria;

  @IsOptional()
  @IsString()
  estilo?: string;

  @IsOptional()
  @IsString()
  condicion?: string;
}
