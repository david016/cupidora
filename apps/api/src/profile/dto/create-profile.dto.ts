import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Gender, Religion } from '../entities/profile.entity.js';

export class PreferencesDto {
  @IsNumber()
  @Min(18)
  @Max(100)
  ageMin!: number;

  @IsNumber()
  @Min(18)
  @Max(100)
  ageMax!: number;

  @IsNumber()
  @Min(1)
  @Max(500)
  maxDistanceKm!: number;

  @IsArray()
  @IsEnum(Religion, { each: true })
  religions!: string[];

  @IsEnum(['male', 'female', 'all'])
  genderPreference!: 'male' | 'female' | 'all';
}

export class CreateProfileDto {
  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsDateString()
  birthDate!: string;

  @IsEnum(Gender)
  gender!: Gender;

  @IsEnum(Religion)
  religion!: Religion;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photoUrls?: string[];

  @ValidateNested()
  @Type(() => PreferencesDto)
  @IsOptional()
  preferences?: PreferencesDto;
}
