import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyAccessToken } from '../utils/jwt';
import { errorResponse } from '../utils/response';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      errorResponse(res, 'NO_TOKEN', '未提供认证令牌', 401);
      return;
    }

    const token = authHeader.substring(7);
    
    try {
      const payload = verifyAccessToken(token);
      req.user = payload;
      next();
    } catch (error) {
      errorResponse(res, 'INVALID_TOKEN', '无效的认证令牌', 401);
      return;
    }
  } catch (error) {
    errorResponse(res, 'AUTH_ERROR', '认证失败', 401);
    return;
  }
};

export const optionalAuthenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = verifyAccessToken(token);
        req.user = payload;
      } catch (error) {
        // 可选认证，token无效时继续
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};
