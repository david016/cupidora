import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity.js';
import { Profile } from '../profile/entities/profile.entity.js';
import { Match } from '../matches/entities/match.entity.js';
import { Like } from './entities/like.entity.js';
import { LikesController } from './likes.controller.js';
import { LikesService } from './likes.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Like, User, Profile, Match])],
  controllers: [LikesController],
  providers: [LikesService],
})
export class LikesModule {}
