import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Profile } from '../profile/entities/profile.entity.js';
import { LikesService } from './likes.service.js';

function toProfileSummary(profile: Profile) {
  return {
    displayName: profile.displayName,
    photoUrls: profile.photoUrls,
    bio: profile.bio,
  };
}

@Controller('likes')
@UseGuards(JwtAuthGuard)
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post(':userId')
  async like(
    @CurrentUser() user: { id: string },
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    const { like, match } = await this.likesService.like(user.id, userId);
    return {
      data: {
        likeId: like.id,
        matched: match !== null,
        matchId: match?.id ?? null,
      },
    };
  }

  @Get('received')
  async getReceived(@CurrentUser() user: { id: string }) {
    const likes = await this.likesService.getReceivedLikes(user.id);
    return {
      data: likes.map((like) => ({
        likeId: like.id,
        createdAt: like.createdAt,
        user: {
          id: like.liker.id,
          profile: like.liker.profile
            ? toProfileSummary(like.liker.profile)
            : null,
        },
      })),
    };
  }

  @Get('sent')
  async getSent(@CurrentUser() user: { id: string }) {
    const likes = await this.likesService.getSentLikes(user.id);
    return {
      data: likes.map((like) => ({
        likeId: like.id,
        createdAt: like.createdAt,
        user: {
          id: like.liked.id,
          profile: like.liked.profile
            ? toProfileSummary(like.liked.profile)
            : null,
        },
      })),
    };
  }

  @Delete(':userId')
  async unlike(
    @CurrentUser() user: { id: string },
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    await this.likesService.unlike(user.id, userId);
    return { data: null };
  }
}
