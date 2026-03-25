import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity.js';

@Entity('matches')
@Unique('UQ_match_pair', ['user1Id', 'user2Id'])
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user1_id' })
  user1!: User;

  @Column({ name: 'user1_id' })
  user1Id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user2_id' })
  user2!: User;

  @Column({ name: 'user2_id' })
  user2Id!: string;

  @CreateDateColumn({ name: 'matched_at' })
  matchedAt!: Date;
}
