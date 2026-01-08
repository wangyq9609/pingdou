import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/AuthService';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../types';
import logger from '../utils/logger';

const authService = new AuthService();

// 注册验证规则
export const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度必须在3-50个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('请提供有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('密码长度至少8个字符')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码必须包含大小写字母和数字'),
];

// 登录验证规则
export const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('请提供有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('请提供密码'),
];

// 注册
export const register = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 'VALIDATION_ERROR', '输入验证失败', 400, errors.array());
    }

    const { username, email, password } = req.body;

    const result = await authService.register(username, email, password);
    
    return successResponse(res, result, 201);
  } catch (error: any) {
    logger.error('Register error:', error);
    
    if (error.message === 'USERNAME_EXISTS') {
      return errorResponse(res, 'USERNAME_EXISTS', '用户名已存在', 400);
    }
    if (error.message === 'EMAIL_EXISTS') {
      return errorResponse(res, 'EMAIL_EXISTS', '邮箱已被注册', 400);
    }
    
    return errorResponse(res, 'REGISTER_ERROR', '注册失败', 500);
  }
};

// 登录
export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 'VALIDATION_ERROR', '输入验证失败', 400, errors.array());
    }

    const { email, password } = req.body;

    const result = await authService.login(email, password);
    
    return successResponse(res, result);
  } catch (error: any) {
    logger.error('Login error:', error);
    
    if (error.message === 'INVALID_CREDENTIALS') {
      return errorResponse(res, 'INVALID_CREDENTIALS', '邮箱或密码错误', 401);
    }
    if (error.message === 'ACCOUNT_BANNED') {
      return errorResponse(res, 'ACCOUNT_BANNED', '账号已被封禁', 403);
    }
    if (error.message === 'ACCOUNT_DELETED') {
      return errorResponse(res, 'ACCOUNT_DELETED', '账号已被删除', 403);
    }
    
    return errorResponse(res, 'LOGIN_ERROR', '登录失败', 500);
  }
};

// 刷新令牌
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponse(res, 'NO_REFRESH_TOKEN', '未提供刷新令牌', 400);
    }

    const result = await authService.refreshToken(refreshToken);
    
    return successResponse(res, result);
  } catch (error: any) {
    logger.error('Refresh token error:', error);
    
    return errorResponse(res, 'INVALID_REFRESH_TOKEN', '无效的刷新令牌', 401);
  }
};

// 获取当前用户信息
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return errorResponse(res, 'NOT_AUTHENTICATED', '未认证', 401);
    }

    const result = await authService.getUserInfo(req.user.userId);
    
    return successResponse(res, result);
  } catch (error: any) {
    logger.error('Get me error:', error);
    
    return errorResponse(res, 'GET_USER_ERROR', '获取用户信息失败', 500);
  }
};

// 登出
export const logout = async (req: AuthRequest, res: Response) => {
  try {
    // 客户端删除token即可，服务端可以记录登出日志
    logger.info(`User logged out: ${req.user?.userId}`);
    
    return successResponse(res, { message: '登出成功' });
  } catch (error: any) {
    logger.error('Logout error:', error);
    
    return errorResponse(res, 'LOGOUT_ERROR', '登出失败', 500);
  }
};
