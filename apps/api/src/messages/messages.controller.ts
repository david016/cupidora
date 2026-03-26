import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ConversationQueryDto } from './dto/conversation-query.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { MessagesGateway } from './messages.gateway.js';
import { MessagesService } from './messages.service.js';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly messagesGateway: MessagesGateway,
  ) {}

  @Post()
  async sendMessage(
    @CurrentUser() user: { id: string },
    @Body() dto: SendMessageDto,
  ) {
    const message = await this.messagesService.sendMessage(user.id, dto);

    // Emit real-time event to the recipient
    this.messagesGateway.sendToUser(dto.recipientId, 'newMessage', {
      id: message.id,
      senderId: message.senderId,
      recipientId: message.recipientId,
      matchId: message.matchId,
      content: message.content,
      createdAt: message.createdAt,
    });

    return {
      data: {
        id: message.id,
        senderId: message.senderId,
        recipientId: message.recipientId,
        matchId: message.matchId,
        content: message.content,
        createdAt: message.createdAt,
      },
    };
  }

  @Get('conversations')
  async getConversations(@CurrentUser() user: { id: string }) {
    const conversations = await this.messagesService.getConversations(
      user.id,
    );
    return { data: conversations };
  }

  @Get('conversation/:userId')
  async getConversation(
    @CurrentUser() user: { id: string },
    @Param('userId', ParseUUIDPipe) otherUserId: string,
    @Query() query: ConversationQueryDto,
  ) {
    const { messages, total } = await this.messagesService.getConversation(
      user.id,
      otherUserId,
      query.limit!,
      query.offset!,
    );
    return {
      data: messages.map((msg) => ({
        id: msg.id,
        senderId: msg.senderId,
        recipientId: msg.recipientId,
        matchId: msg.matchId,
        content: msg.content,
        createdAt: msg.createdAt,
        readAt: msg.readAt,
      })),
      meta: { total, limit: query.limit, offset: query.offset },
    };
  }

  @Patch(':messageId/read')
  async markAsRead(
    @CurrentUser() user: { id: string },
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ) {
    const message = await this.messagesService.markAsRead(
      messageId,
      user.id,
    );

    // Notify the sender that their message was read
    this.messagesGateway.sendToUser(message.senderId, 'messageRead', {
      messageId: message.id,
      readAt: message.readAt,
    });

    return {
      data: {
        id: message.id,
        readAt: message.readAt,
      },
    };
  }
}
