import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { RatingsService, CreateRatingDto } from './ratings.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly service: RatingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() dto: CreateRatingDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.service.create(dto, user.userId);
  }

  @Get('user/:userId')
  getByUser(@Param('userId') userId: string) {
    return this.service.getByUser(userId);
  }

  @Get('transaction/:transactionId')
  @UseGuards(JwtAuthGuard)
  getByTransaction(@Param('transactionId') transactionId: string) {
    return this.service.getByTransaction(transactionId);
  }
}
