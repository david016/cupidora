import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from '../likes/entities/like.entity.js';
import { Match } from './entities/match.entity.js';
import { MatchesController } from './matches.controller.js';
import { MatchesService } from './matches.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Match, Like])],
  controllers: [MatchesController],
  providers: [MatchesService],
})
export class MatchesModule {}
