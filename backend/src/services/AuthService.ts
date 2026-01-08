import bcrypt from 'bcrypt';
import prisma from '../db';
import { config } from '../config';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import logger from '../utils/logger';

export class AuthService {
  // 注册用户
  async register(username: string, email: string, password: string) {
    // 检查用户是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new Error('USERNAME_EXISTS');
      }
      if (existingUser.email === email) {
        throw new Error('EMAIL_EXISTS');
      }
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role: 'user',
        status: 'active',
      }
    });

    logger.info(`New user registered: ${user.id} - ${username}`);

    return this.generateTokens(user);
  }

  // 登录
  async login(email: string, password: string) {
    // 查询用户
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // 检查用户状态
    if (user.status === 'banned') {
      throw new Error('ACCOUNT_BANNED');
    }

    if (user.status === 'deleted') {
      throw new Error('ACCOUNT_DELETED');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    logger.info(`User logged in: ${user.id} - ${user.username}`);

    return this.generateTokens(user);
  }

  // 刷新令牌
  async refreshToken(refreshToken: string) {
    const { verifyRefreshToken } = await import('../utils/jwt');
    
    try {
      const payload = verifyRefreshToken(refreshToken);
      
      // 查询用户
      const user = await prisma.user.findUnique({
        where: { id: BigInt(payload.userId) }
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // 检查token版本
      if (user.tokenVersion !== payload.tokenVersion) {
        throw new Error('TOKEN_REVOKED');
      }

      // 生成新的access token
      const activation = await this.getActiveSubscription(user.id);
      
      const accessToken = generateAccessToken({
        userId: Number(user.id),
        username: user.username,
        role: user.role,
        hasActiveSubscription: !!activation,
        expiresAt: activation?.expiresAt.toISOString(),
      });

      return { accessToken };
    } catch (error) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }
  }

  // 生成tokens
  private async generateTokens(user: any) {
    const activation = await this.getActiveSubscription(user.id);

    const accessToken = generateAccessToken({
      userId: Number(user.id),
      username: user.username,
      role: user.role,
      hasActiveSubscription: !!activation,
      expiresAt: activation?.expiresAt.toISOString(),
    });

    const refreshToken = generateRefreshToken({
      userId: Number(user.id),
      tokenVersion: user.tokenVersion,
    });

    return {
      user: {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
      activation: activation ? {
        codeType: activation.codeType,
        expiresAt: activation.expiresAt.toISOString(),
      } : null,
    };
  }

  // 获取有效激活
  private async getActiveSubscription(userId: bigint) {
    return await prisma.userActivation.findFirst({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      orderBy: { expiresAt: 'desc' }
    });
  }

  // 获取用户信息
  async getUserInfo(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) }
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const activation = await this.getActiveSubscription(user.id);

    return {
      user: {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      activation: activation ? {
        codeType: activation.codeType,
        expiresAt: activation.expiresAt.toISOString(),
        daysLeft: Math.ceil((activation.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      } : null,
    };
  }
}
