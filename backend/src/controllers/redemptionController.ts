import { Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import { RedemptionService } from '../services/RedemptionService';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../types';
import logger from '../utils/logger';

const redemptionService = new RedemptionService();

// 兑换验证规则
export const redeemValidation = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('请提供兑换码')
    .matches(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/)
    .withMessage('兑换码格式错误'),
];

// 兑换激活码
export const redeem = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 'VALIDATION_ERROR', '输入验证失败', 400, errors.array());
    }

    if (!req.user) {
      return errorResponse(res, 'NOT_AUTHENTICATED', '请先登录', 401);
    }

    const { code } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');

    const result = await redemptionService.redeemCode(
      req.user.userId,
      code.toUpperCase(),
      ipAddress,
      userAgent
    );
    
    return successResponse(res, result);
  } catch (error: any) {
    logger.error('Redeem error:', error);
    
    if (error.message === 'INVALID_CODE_FORMAT') {
      return errorResponse(res, 'INVALID_CODE_FORMAT', '兑换码格式错误', 400);
    }
    if (error.message === 'CODE_NOT_FOUND') {
      return errorResponse(res, 'CODE_NOT_FOUND', '兑换码不存在', 404);
    }
    if (error.message === 'CODE_ALREADY_USED') {
      return errorResponse(res, 'CODE_ALREADY_USED', '兑换码已被使用', 400);
    }
    if (error.message === 'CODE_EXPIRED') {
      return errorResponse(res, 'CODE_EXPIRED', '兑换码已过期', 400);
    }
    if (error.message === 'USER_ALREADY_REDEEMED') {
      return errorResponse(res, 'USER_ALREADY_REDEEMED', '您已经兑换过此码', 400);
    }
    
    return errorResponse(res, 'REDEEM_ERROR', '兑换失败', 500);
  }
};

// 查询我的激活记录
export const getMyActivations = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return errorResponse(res, 'NOT_AUTHENTICATED', '请先登录', 401);
    }

    const activations = await redemptionService.getMyActivations(req.user.userId);
    
    return successResponse(res, { activations });
  } catch (error: any) {
    logger.error('Get activations error:', error);
    
    return errorResponse(res, 'GET_ACTIVATIONS_ERROR', '获取激活记录失败', 500);
  }
};

// 检查当前激活状态
export const checkStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return errorResponse(res, 'NOT_AUTHENTICATED', '请先登录', 401);
    }

    const status = await redemptionService.checkStatus(req.user.userId);
    
    return successResponse(res, status);
  } catch (error: any) {
    logger.error('Check status error:', error);
    
    return errorResponse(res, 'CHECK_STATUS_ERROR', '检查激活状态失败', 500);
  }
};

// 生成兑换码（管理员）
export const generateCodesValidation = [
  body('codeType')
    .isIn(['trial_30', 'standard_90', 'premium_365'])
    .withMessage('无效的兑换码类型'),
  body('quantity')
    .isInt({ min: 1, max: 1000 })
    .withMessage('数量必须在1-1000之间'),
  body('batchId')
    .optional()
    .isString()
    .withMessage('批次ID必须是字符串'),
  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('有效期必须是有效的日期格式'),
];

export const generateCodes = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 'VALIDATION_ERROR', '输入验证失败', 400, errors.array());
    }

    if (!req.user || req.user.role !== 'admin') {
      return errorResponse(res, 'FORBIDDEN', '需要管理员权限', 403);
    }

    const { codeType, quantity, batchId, validUntil } = req.body;

    const result = await redemptionService.generateCodes(
      codeType,
      quantity,
      batchId,
      validUntil ? new Date(validUntil) : undefined,
      req.user.userId
    );
    
    return successResponse(res, result, 201);
  } catch (error: any) {
    logger.error('Generate codes error:', error);
    
    if (error.message === 'INVALID_CODE_TYPE') {
      return errorResponse(res, 'INVALID_CODE_TYPE', '无效的兑换码类型', 400);
    }
    
    return errorResponse(res, 'GENERATE_CODES_ERROR', '生成兑换码失败', 500);
  }
};

// 查询兑换码列表（管理员）
export const listCodesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间'),
  query('status')
    .optional()
    .isIn(['unused', 'used', 'expired', 'revoked'])
    .withMessage('无效的状态'),
];

export const listCodes = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 'VALIDATION_ERROR', '输入验证失败', 400, errors.array());
    }

    if (!req.user || req.user.role !== 'admin') {
      return errorResponse(res, 'FORBIDDEN', '需要管理员权限', 403);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const batchId = req.query.batchId as string;

    const result = await redemptionService.listCodes(page, limit, status, batchId);
    
    return successResponse(res, result);
  } catch (error: any) {
    logger.error('List codes error:', error);
    
    return errorResponse(res, 'LIST_CODES_ERROR', '获取兑换码列表失败', 500);
  }
};

// 撤销兑换码（管理员）
export const revokeCode = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return errorResponse(res, 'FORBIDDEN', '需要管理员权限', 403);
    }

    const codeId = parseInt(req.params.id);

    if (isNaN(codeId)) {
      return errorResponse(res, 'INVALID_ID', '无效的兑换码ID', 400);
    }

    const result = await redemptionService.revokeCode(codeId);
    
    return successResponse(res, result);
  } catch (error: any) {
    logger.error('Revoke code error:', error);
    
    if (error.message === 'CODE_NOT_FOUND') {
      return errorResponse(res, 'CODE_NOT_FOUND', '兑换码不存在', 404);
    }
    
    return errorResponse(res, 'REVOKE_CODE_ERROR', '撤销兑换码失败', 500);
  }
};
