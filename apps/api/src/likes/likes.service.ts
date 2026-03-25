import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity.js';
import { Profile } from '../profile/entities/profile.entity.js';
import { Match } from '../matches/entities/match.entity.js';
import { Like } from './entities/like.entity.js';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
  ) {}

  async like(
    likerId: string,
    likedId: string,
  ): Promise<{ like: Like; match: Match | null }> {
    if (likerId === likedId) {
      throw new BadRequestException('You cannot like yourself');
    }

    const targetUser = await this.userRepo.findOne({ where: { id: likedId } });
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const targetProfile = await this.profileRepo.findOne({
      where: { userId: likedId },
    });
    if (!targetProfile) {
      throw new NotFoundException('User has no profile');
    }

    // TODO: Check if the target user has blocked the liker (blocks table)

    const existing = await this.likeRepo.findOne({
      where: { likerId, likedId },
    });
    if (existing) {
      throw new ConflictException('You have already liked this user');
    }

    const like = this.likeRepo.create({ likerId, likedId });
    await this.likeRepo.save(like);

    // Check for mutual like → auto-create match
    let match: Match | null = null;
    const reciprocal = await this.likeRepo.findOne({
      where: { likerId: likedId, likedId: likerId },
    });

    if (reciprocal) {
      const [u1, u2] = [likerId, likedId].sort();
      const existingMatch = await this.matchRepo.findOne({
        where: { user1Id: u1, user2Id: u2 },
      });

      if (!existingMatch) {
        match = this.matchRepo.create({ user1Id: u1, user2Id: u2 });
        match = await this.matchRepo.save(match);
      }
    }

    return { like, match };
  }

  async getReceivedLikes(userId: string): Promise<Like[]> {
    return this.likeRepo.find({
      where: { likedId: userId },
      relations: ['liker', 'liker.profile'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSentLikes(userId: string): Promise<Like[]> {
    return this.likeRepo.find({
      where: { likerId: userId },
      relations: ['liked', 'liked.profile'],
      order: { createdAt: 'DESC' },
    });
  }

  async unlike(likerId: string, likedId: string): Promise<void> {
    const like = await this.likeRepo.findOne({
      where: { likerId, likedId },
    });
    if (!like) {
      throw new NotFoundException('Like not found');
    }

    // Remove match if one exists (sorted pair)
    const [u1, u2] = [likerId, likedId].sort();
    await this.matchRepo.delete({ user1Id: u1, user2Id: u2 });

    await this.likeRepo.remove(like);
  }
}
