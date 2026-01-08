import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/authenticate';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// 注册
router.post(
  '/register',
  authLimiter,
  authController.registerValidation,
  authController.register
);

// 登录
router.post(
  '/login',
  authLimiter,
  authController.loginValidation,
  authController.login
);

// 刷新令牌
router.post('/refresh-token', authController.refreshToken);

// 获取当前用户信息
router.get('/me', authenticate, authController.getMe);

// 登出
router.post('/logout', authenticate, authController.logout);

export default router;
