import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../matches/entities/match.entity.js';
import { Message } from './entities/message.entity.js';
import { MessagesController } from './messages.controller.js';
import { MessagesGateway } from './messages.gateway.js';
import { MessagesService } from './messages.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Match]),
    JwtModule.register({}),
  ],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway],
})
export class MessagesModule {}
