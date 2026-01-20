import { Request } from 'express';
import { AccessTokenPayload } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: AccessTokenPayload;
  activation?: {
    id: bigint;
    userId: bigint;
    codeType: string;
    expiresAt: Date;
  };
}

export interface CodeTypeConfig {
  name: string;
  durationDays: number;
}

export const CODE_TYPES: Record<string, CodeTypeConfig> = {
  trial_30: {
    name: '体验版',
    durationDays: 30
  },
  standard_90: {
    name: '标准版',
    durationDays: 90
  },
  premium_365: {
    name: '高级版',
    durationDays: 365
  }
};
