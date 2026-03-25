import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity.js';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum Religion {
  CHRISTIANITY = 'christianity',
  ISLAM = 'islam',
  JUDAISM = 'judaism',
  HINDUISM = 'hinduism',
  BUDDHISM = 'buddhism',
  OTHER = 'other',
  NONE = 'none',
}

export interface ProfilePreferences {
  ageMin: number;
  ageMax: number;
  maxDistanceKm: number;
  religions: string[];
  genderPreference: 'male' | 'female' | 'all';
}

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'display_name' })
  displayName!: string;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ name: 'birth_date', type: 'date' })
  birthDate!: string;

  @Column({ type: 'enum', enum: Gender })
  gender!: Gender;

  @Column({ type: 'enum', enum: Religion })
  religion!: Religion;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location!: object | null;

  @Column({ name: 'photo_urls', type: 'jsonb', default: '[]' })
  photoUrls!: string[];

  @Column({ type: 'jsonb', nullable: true })
  preferences!: ProfilePreferences | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
