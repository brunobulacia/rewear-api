import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre?: string;

  // El usuario puede alternar entre comprador y vendedor. ADMIN no es asignable
  // desde acá (evita escalada de privilegios).
  @IsOptional()
  @IsIn(['BUYER', 'SELLER'])
  rol?: 'BUYER' | 'SELLER';

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  ubicacion?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
