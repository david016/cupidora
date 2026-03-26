import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Repository } from 'typeorm';
import { Match } from '../matches/entities/match.entity.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { Message } from './entities/message.entity.js';

@Injectable()
export class MessagesService {
  private readonly redis: Redis;

  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
    config: ConfigService,
  ) {
    this.redis = new Redis({
      host: config.get<string>('REDIS_HOST', 'localhost'),
      port: config.get<number>('REDIS_PORT', 6379),
    });
  }

  async sendMessage(
    senderId: string,
    dto: SendMessageDto,
  ): Promise<Message> {
    const { recipientId, content } = dto;

    // Check if a match exists between the two users
    const match = await this.matchRepo.findOne({
      where: [
        { user1Id: senderId, user2Id: recipientId },
        { user1Id: recipientId, user2Id: senderId },
      ],
    });

    if (!match) {
      // Unmatched: enforce daily limit via Redis
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const key = `daily_unmatched_msg:${senderId}:${today}`;

      const exists = await this.redis.exists(key);
      if (exists) {
        throw new ForbiddenException(
          'You can only send one message per day to unmatched users',
        );
      }

      // Calculate seconds until midnight UTC
      const now = new Date();
      const midnight = new Date(now);
      midnight.setUTCDate(midnight.getUTCDate() + 1);
      midnight.setUTCHours(0, 0, 0, 0);
      const ttl = Math.ceil((midnight.getTime() - now.getTime()) / 1000);

      await this.redis.set(key, '1', 'EX', ttl);
    }

    const message = this.messageRepo.create({
      senderId,
      recipientId,
      matchId: match?.id ?? null,
      content,
    });

    return this.messageRepo.save(message);
  }

  async getConversations(userId: string) {
    // Get the latest message for each conversation partner
    const messages = await this.messageRepo
      .createQueryBuilder('msg')
      .innerJoin(
        (qb) =>
          qb
            .select('MAX(m."created_at")', 'max_created')
            .addSelect(
              `CASE WHEN m."sender_id" = :uid THEN m."recipient_id" ELSE m."sender_id" END`,
              'partner_id',
            )
            .from(Message, 'm')
            .where('m."sender_id" = :uid OR m."recipient_id" = :uid')
            .groupBy(
              `CASE WHEN m."sender_id" = :uid THEN m."recipient_id" ELSE m."sender_id" END`,
            ),
        'latest',
        'msg."created_at" = latest."max_created" AND ' +
          `CASE WHEN msg."sender_id" = :uid THEN msg."recipient_id" ELSE msg."sender_id" END = latest."partner_id"`,
      )
      .leftJoinAndSelect('msg.sender', 'sender')
      .leftJoinAndSelect('sender.profile', 'senderProfile')
      .leftJoinAndSelect('msg.recipient', 'recipient')
      .leftJoinAndSelect('recipient.profile', 'recipientProfile')
      .leftJoinAndSelect('msg.match', 'match')
      .setParameter('uid', userId)
      .orderBy('msg."created_at"', 'DESC')
      .getMany();

    return messages.map((msg) => {
      const otherUser =
        msg.senderId === userId ? msg.recipient : msg.sender;
      return {
        user: {
          id: otherUser.id,
          profile: otherUser.profile
            ? {
                displayName: otherUser.profile.displayName,
                photoUrls: otherUser.profile.photoUrls,
                bio: otherUser.profile.bio,
              }
            : null,
        },
        matchId: msg.matchId,
        lastMessage: {
          id: msg.id,
          content: msg.content,
          senderId: msg.senderId,
          createdAt: msg.createdAt,
          readAt: msg.readAt,
        },
      };
    });
  }

  async getConversation(
    userId: string,
    otherUserId: string,
    limit: number,
    offset: number,
  ) {
    const [messages, total] = await this.messageRepo.findAndCount({
      where: [
        { senderId: userId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: userId },
      ],
      order: { createdAt: 'ASC' },
      take: limit,
      skip: offset,
    });

    return { messages, total };
  }

  async markAsRead(messageId: string, userId: string): Promise<Message> {
    const message = await this.messageRepo.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.recipientId !== userId) {
      throw new ForbiddenException(
        'Only the recipient can mark a message as read',
      );
    }

    message.readAt = new Date();
    return this.messageRepo.save(message);
  }
}
