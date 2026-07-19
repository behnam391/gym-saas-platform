import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/message.dto';

const TENANT_ROLES = ['GYM_OWNER', 'TRAINER', 'NUTRITIONIST', 'RECEPTION', 'BUFFET_STAFF', 'ATHLETE'];

@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...TENANT_ROLES)
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get('conversations')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.messages.listConversations(user.userId);
  }

  @Get('conversations/:conversationId')
  get(@CurrentUser() user: AuthenticatedUser, @Param('conversationId') conversationId: string) {
    return this.messages.getConversation(user.userId, conversationId);
  }

  @Post()
  send(@CurrentUser() user: AuthenticatedUser, @Body() dto: SendMessageDto) {
    return this.messages.send(user.userId, dto);
  }

  @Patch('conversations/:conversationId/read')
  markRead(@CurrentUser() user: AuthenticatedUser, @Param('conversationId') conversationId: string) {
    return this.messages.markRead(user.userId, conversationId);
  }
}

