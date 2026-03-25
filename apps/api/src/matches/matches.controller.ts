import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Profile } from '../profile/entities/profile.entity.js';
import { MatchesService } from './matches.service.js';

function toProfileSummary(profile: Profile) {
  return {
    displayName: profile.displayName,
    photoUrls: profile.photoUrls,
    bio: profile.bio,
  };
}

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  async getMatches(@CurrentUser() user: { id: string }) {
    const matches = await this.matchesService.getMatches(user.id);
    return {
      data: matches.map((match) => {
        const otherUser =
          match.user1Id === user.id ? match.user2 : match.user1;
        return {
          matchId: match.id,
          matchedAt: match.matchedAt,
          user: {
            id: otherUser.id,
            profile: otherUser.profile
              ? toProfileSummary(otherUser.profile)
              : null,
          },
        };
      }),
    };
  }

  @Delete(':matchId')
  async unmatch(
    @CurrentUser() user: { id: string },
    @Param('matchId', ParseUUIDPipe) matchId: string,
  ) {
    await this.matchesService.unmatch(matchId, user.id);
    return { data: null };
  }
}
