import rateLimit from 'express-rate-limit';
import { config } from '../config';

// 通用限流
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { 
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '请求过于频繁，请稍后再试'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 认证接口限流（更严格）
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10分钟
  max: 15, // 最多15次（放宽限制）
  message: { 
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: '登录尝试过多，请10分钟后再试'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 兑换码限流
export const redeemLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30分钟
  max: 20, // 最多20次（放宽限制）
  message: { 
    success: false,
    error: {
      code: 'REDEEM_RATE_LIMIT_EXCEEDED',
      message: '兑换尝试过多，请30分钟后再试'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});
