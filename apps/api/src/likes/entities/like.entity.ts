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

@Entity('likes')
@Unique('UQ_liker_liked', ['likerId', 'likedId'])
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'liker_id' })
  liker!: User;

  @Column({ name: 'liker_id' })
  likerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'liked_id' })
  liked!: User;

  @Column({ name: 'liked_id' })
  likedId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
