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
import { CreateProfileDto } from './dto/create-profile.dto.js';
import { DiscoverQueryDto } from './dto/discover-query.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { Profile } from './entities/profile.entity.js';
import { ProfileService } from './profile.service.js';

function toPublicProfile(profile: Profile) {
  const { preferences, ...publicFields } = profile;
  return publicFields;
}

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  async create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateProfileDto,
  ) {
    const profile = await this.profileService.create(user.id, dto);
    return { data: profile };
  }

  @Get('me')
  async getMe(@CurrentUser() user: { id: string }) {
    const profile = await this.profileService.findByUserId(user.id);
    return { data: profile };
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProfileDto,
  ) {
    const profile = await this.profileService.update(user.id, dto);
    return { data: profile };
  }

  @Get('discover')
  async discover(
    @CurrentUser() user: { id: string },
    @Query() query: DiscoverQueryDto,
  ) {
    const profiles = await this.profileService.discover(user.id, query);
    return {
      data: profiles.map(toPublicProfile),
      meta: { limit: query.limit, offset: query.offset },
    };
  }

  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    const profile = await this.profileService.findById(id);
    return { data: toPublicProfile(profile) };
  }
}
