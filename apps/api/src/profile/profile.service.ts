import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProfileDto } from './dto/create-profile.dto.js';
import { DiscoverQueryDto } from './dto/discover-query.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { Profile } from './entities/profile.entity.js';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
  ) {}

  async create(userId: string, dto: CreateProfileDto): Promise<Profile> {
    const existing = await this.profileRepo.findOne({ where: { userId } });
    if (existing) {
      throw new ConflictException('Profile already exists');
    }

    const profile = this.profileRepo.create({
      userId,
      displayName: dto.displayName,
      bio: dto.bio ?? null,
      birthDate: dto.birthDate,
      gender: dto.gender,
      religion: dto.religion,
      location: this.buildPoint(dto.longitude, dto.latitude),
      photoUrls: dto.photoUrls ?? [],
      preferences: dto.preferences ?? null,
    });

    return this.profileRepo.save(profile);
  }

  async findByUserId(userId: string): Promise<Profile> {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async findById(id: string): Promise<Profile> {
    const profile = await this.profileRepo.findOne({ where: { id } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async update(userId: string, dto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.findByUserId(userId);

    if (dto.displayName !== undefined) profile.displayName = dto.displayName;
    if (dto.bio !== undefined) profile.bio = dto.bio ?? null;
    if (dto.birthDate !== undefined) profile.birthDate = dto.birthDate;
    if (dto.gender !== undefined) profile.gender = dto.gender;
    if (dto.religion !== undefined) profile.religion = dto.religion;
    if (dto.longitude !== undefined || dto.latitude !== undefined) {
      profile.location = this.buildPoint(
        dto.longitude ?? null,
        dto.latitude ?? null,
      );
    }
    if (dto.photoUrls !== undefined) profile.photoUrls = dto.photoUrls;
    if (dto.preferences !== undefined)
      profile.preferences = dto.preferences ?? null;

    return this.profileRepo.save(profile);
  }

  async discover(
    userId: string,
    query: DiscoverQueryDto,
  ): Promise<Profile[]> {
    const myProfile = await this.findByUserId(userId);
    const prefs = myProfile.preferences;

    const qb = this.profileRepo
      .createQueryBuilder('p')
      .where('p.user_id != :userId', { userId });

    // Filter by gender preference
    if (prefs?.genderPreference && prefs.genderPreference !== 'all') {
      qb.andWhere('p.gender = :gender', { gender: prefs.genderPreference });
    }

    // Filter by religion
    if (prefs?.religions && prefs.religions.length > 0) {
      qb.andWhere('p.religion IN (:...religions)', {
        religions: prefs.religions,
      });
    }

    // Filter by age range (calculated from birthDate)
    if (prefs?.ageMin) {
      const maxBirthDate = new Date();
      maxBirthDate.setFullYear(maxBirthDate.getFullYear() - prefs.ageMin);
      qb.andWhere('p.birth_date <= :maxBirthDate', {
        maxBirthDate: maxBirthDate.toISOString().split('T')[0],
      });
    }
    if (prefs?.ageMax) {
      const minBirthDate = new Date();
      minBirthDate.setFullYear(minBirthDate.getFullYear() - prefs.ageMax - 1);
      qb.andWhere('p.birth_date >= :minBirthDate', {
        minBirthDate: minBirthDate.toISOString().split('T')[0],
      });
    }

    // Filter by distance using ST_DWithin (PostGIS)
    if (myProfile.location && prefs?.maxDistanceKm) {
      qb.andWhere(
        'ST_DWithin(p.location, ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography, :dist)',
        {
          lng: (myProfile.location as { coordinates: [number, number] }).coordinates[0],
          lat: (myProfile.location as { coordinates: [number, number] }).coordinates[1],
          dist: prefs.maxDistanceKm * 1000,
        },
      );
    }

    qb.orderBy('RANDOM()');
    qb.skip(query.offset);
    qb.take(query.limit);

    return qb.getMany();
  }

  private buildPoint(
    longitude?: number | null,
    latitude?: number | null,
  ): object | null {
    if (longitude == null || latitude == null) return null;
    return {
      type: 'Point',
      coordinates: [longitude, latitude],
    };
  }
}
