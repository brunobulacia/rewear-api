import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const userId: string = req.user?.userId;
    if (!userId) throw new ForbiddenException();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { rol: true },
    });

    if (user?.rol !== 'ADMIN') throw new ForbiddenException('Se requiere rol ADMIN');
    return true;
  }
}
