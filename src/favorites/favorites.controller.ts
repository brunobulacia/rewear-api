import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly service: FavoritesService) {}

  /** Agrega/quita una prenda de favoritos. */
  @Post(':garmentId')
  toggle(
    @Param('garmentId') garmentId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.service.toggle(user.userId, garmentId);
  }

  /** Lista las prendas favoritas del usuario. */
  @Get('mine')
  findMine(@CurrentUser() user: { userId: string }) {
    return this.service.findMine(user.userId);
  }

  /** IDs de favoritos (para el estado del corazón en el catálogo). */
  @Get('ids')
  myIds(@CurrentUser() user: { userId: string }) {
    return this.service.myIds(user.userId);
  }
}
