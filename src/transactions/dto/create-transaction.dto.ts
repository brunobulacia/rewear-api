import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  garmentId: string;

  /** bytes32 hex del tradeId emitido por el contrato Escrow */
  @IsString()
  @IsNotEmpty()
  escrowTradeId: string;

  /** Hash de la tx createAndFund en la blockchain */
  @IsString()
  @IsNotEmpty()
  escrowTxHash: string;

  /** Monto en MATIC (como número de punto flotante) */
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amountMatic: number;
}
