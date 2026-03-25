import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from '../likes/entities/like.entity.js';
import { Match } from './entities/match.entity.js';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,
  ) {}

  async getMatches(userId: string): Promise<Match[]> {
    return this.matchRepo.find({
      where: [{ user1Id: userId }, { user2Id: userId }],
      relations: ['user1', 'user1.profile', 'user2', 'user2.profile'],
      order: { matchedAt: 'DESC' },
    });
  }

  async unmatch(matchId: string, userId: string): Promise<void> {
    const match = await this.matchRepo.findOne({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new NotFoundException('Match not found');
    }

    // Remove both likes between the pair
    await this.likeRepo.delete({
      likerId: match.user1Id,
      likedId: match.user2Id,
    });
    await this.likeRepo.delete({
      likerId: match.user2Id,
      likedId: match.user1Id,
    });

    await this.matchRepo.remove(match);
  }
}
