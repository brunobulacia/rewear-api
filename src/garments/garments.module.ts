import { Module } from '@nestjs/common';
import { GarmentsController } from './garments.controller';
import { GarmentsService } from './garments.service';
import { CloudinaryService } from '../storage/cloudinary.service';
import { VerificationModule } from '../verification/verification.module';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [VerificationModule, BlockchainModule],
  controllers: [GarmentsController],
  providers: [GarmentsService, CloudinaryService],
})
export class GarmentsModule {}
