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
  features: string[];
}

export const CODE_TYPES: Record<string, CodeTypeConfig> = {
  trial_30: {
    name: '体验版',
    durationDays: 30,
    features: ['basic_conversion', 'export_png', 'max_size_29x29']
  },
  standard_90: {
    name: '标准版',
    durationDays: 90,
    features: ['basic_conversion', 'export_png', 'export_pdf', 'max_size_58x58', 'save_projects']
  },
  premium_365: {
    name: '高级版',
    durationDays: 365,
    features: ['all_features', 'batch_processing', 'unlimited_size', 'no_watermark', 'priority_support']
  }
};
