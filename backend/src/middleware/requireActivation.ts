import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { errorResponse } from '../utils/response';
import prisma from '../db';

export const requireActiveSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'NOT_AUTHENTICATED', '请先登录', 401);
      return;
    }

    const userId = BigInt(req.user.userId);
    
    // 查询用户最新的有效激活
    const activation = await prisma.userActivation.findFirst({
      where: {
        userId: userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      orderBy: { expiresAt: 'desc' }
    });
    
    if (!activation) {
      errorResponse(res, 'NO_ACTIVE_SUBSCRIPTION', '请先激活兑换码才能使用此功能', 403);
      return;
    }
    
    // 附加激活信息到请求
    req.activation = {
      id: activation.id,
      userId: activation.userId,
      codeType: activation.codeType,
      expiresAt: activation.expiresAt
    };
    
    next();
  } catch (error) {
    errorResponse(res, 'ACTIVATION_CHECK_ERROR', '验证激活状态失败', 500);
    return;
  }
};
