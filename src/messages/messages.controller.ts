import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { MessagesService, SendMessageDto } from './messages.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly service: MessagesService) {}

  @Post()
  send(
    @Body() dto: SendMessageDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.service.send(dto, user.userId);
  }

  @Get('inbox')
  getInbox(@CurrentUser() user: { userId: string }) {
    return this.service.getInbox(user.userId);
  }

  @Get('transaction/:transactionId')
  getByTransaction(
    @Param('transactionId') transactionId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.service.getByTransaction(transactionId, user.userId);
  }
}
