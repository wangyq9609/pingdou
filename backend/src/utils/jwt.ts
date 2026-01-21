import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';

export interface AccessTokenPayload {
  userId: number;
  username: string;
  role: string;
  hasActiveSubscription: boolean;
  expiresAt?: string;
}

export interface RefreshTokenPayload {
  userId: number;
  tokenVersion: number;
}

export const generateAccessToken = (payload: AccessTokenPayload): string => {
  // @ts-expect-error - expiresIn accepts string like '2h', '7d' but types are strict
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessTokenExpiry,
  });
};

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  // @ts-expect-error - expiresIn accepts string like '2h', '7d' but types are strict
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshTokenExpiry,
  });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    return jwt.verify(token, config.jwt.secret) as AccessTokenPayload;
  } catch (error) {
    throw new Error('INVALID_TOKEN');
  }
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
  } catch (error) {
    throw new Error('INVALID_REFRESH_TOKEN');
  }
};
