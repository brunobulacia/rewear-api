import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class ConfirmDeliveryDto {
  /** Hash de la tx confirmDelivery en la blockchain */
  @IsString()
  @IsNotEmpty()
  txHash: string;
}

export class OpenDisputeDto {
  /** Hash de la tx openDispute en la blockchain */
  @IsString()
  @IsNotEmpty()
  txHash: string;
}

export class ResolveDisputeDto {
  @IsBoolean()
  buyerWins: boolean;

  @IsOptional()
  @IsString()
  txHash?: string;
}
