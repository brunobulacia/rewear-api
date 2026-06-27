import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Categoria } from '../categoria';

export class CreateGarmentDto {
  @IsString()
  titulo: string;

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

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  precio: number;
}
