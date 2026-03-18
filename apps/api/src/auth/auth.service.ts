import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.issueTokens(user);
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = await this.jwtService.verifyAsync<AuthUser>(
        refreshTokenDto.refreshToken,
        {
          secret: this.getRefreshSecret(),
        },
      );
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token.');
      }

      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token.');
    }
  }

  async me(user: AuthUser) {
    return this.usersService.getProfile(user.sub);
  }

  private async issueTokens(
    user: NonNullable<Awaited<ReturnType<UsersService['findByEmail']>>>,
  ) {
    const payload: AuthUser = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload, {
        secret: this.getAccessSecret(),
        expiresIn: this.getAccessExpiresIn(),
      }),
      refreshToken: await this.jwtService.signAsync(payload, {
        secret: this.getRefreshSecret(),
        expiresIn: this.getRefreshExpiresIn(),
      }),
      user: this.usersService.toSafeUser(user),
    };
  }

  private getAccessSecret() {
    return this.configService.get('JWT_SECRET') ?? 'soil-secret';
  }

  private getAccessExpiresIn() {
    return this.configService.get('JWT_EXPIRES_IN') ?? '12h';
  }

  private getRefreshSecret() {
    return (
      this.configService.get('JWT_REFRESH_SECRET') ??
      `${this.getAccessSecret()}-refresh`
    );
  }

  private getRefreshExpiresIn() {
    return this.configService.get('JWT_REFRESH_EXPIRES_IN') ?? '30d';
  }
}
