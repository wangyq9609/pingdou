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
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次
  message: { 
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: '登录尝试过多，请15分钟后再试'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 兑换码限流
export const redeemLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 5, // 最多5次
  message: { 
    success: false,
    error: {
      code: 'REDEEM_RATE_LIMIT_EXCEEDED',
      message: '兑换尝试过多，请1小时后再试'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});
