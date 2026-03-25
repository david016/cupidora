import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { MoreThan, Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity.js';
import { User } from './entities/user.entity.js';
import { JwtPayload } from './strategies/jwt.strategy.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(email: string, password: string): Promise<TokenPair> {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = this.userRepo.create({ email, passwordHash });
    await this.userRepo.save(user);

    return this.generateTokenPair(user);
  }

  async login(email: string, password: string): Promise<TokenPair> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokenPair(user);
  }

  async refresh(rawRefreshToken: string): Promise<TokenPair> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(rawRefreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = await bcrypt.hash(rawRefreshToken, 12);

    // Find a valid (non-revoked, non-expired) refresh token for this user
    const storedTokens = await this.refreshTokenRepo.find({
      where: {
        userId: payload.sub,
        revoked: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    const matchedToken = await this.findMatchingToken(
      storedTokens,
      rawRefreshToken,
    );
    if (!matchedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke the used token
    matchedToken.revoked = true;
    await this.refreshTokenRepo.save(matchedToken);

    const user = await this.userRepo.findOneOrFail({
      where: { id: payload.sub },
    });

    return this.generateTokenPair(user);
  }

  private async findMatchingToken(
    tokens: RefreshToken[],
    rawToken: string,
  ): Promise<RefreshToken | undefined> {
    for (const token of tokens) {
      const matches = await bcrypt.compare(rawToken, token.tokenHash);
      if (matches) {
        return token;
      }
    }
    return undefined;
  }

  private async generateTokenPair(user: User): Promise<TokenPair> {
    const payload: JwtPayload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(
      { ...payload },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn:
          (this.config.get<string>('JWT_ACCESS_EXPIRATION') as string) ?? '15m',
      } as any,
    );

    const refreshToken = this.jwtService.sign(
      { ...payload },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn:
          (this.config.get<string>('JWT_REFRESH_EXPIRATION') as string) ?? '7d',
      } as any,
    );

    // Store hashed refresh token
    const tokenHash = await bcrypt.hash(refreshToken, 12);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshTokenEntity = this.refreshTokenRepo.create({
      tokenHash,
      expiresAt,
      userId: user.id,
    });
    await this.refreshTokenRepo.save(refreshTokenEntity);

    return { accessToken, refreshToken };
  }
}
