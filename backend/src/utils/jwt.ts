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
  const options: SignOptions = {
    expiresIn: config.jwt.accessTokenExpiry,
  };
  return jwt.sign(payload, config.jwt.secret, options);
};

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  const options: SignOptions = {
    expiresIn: config.jwt.refreshTokenExpiry,
  };
  return jwt.sign(payload, config.jwt.refreshSecret, options);
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
