import { Router } from 'express';
import * as redemptionController from '../controllers/redemptionController';
import { authenticate } from '../middleware/authenticate';
import { redeemLimiter } from '../middleware/rateLimiter';

const router = Router();

// 兑换激活码
router.post(
  '/redeem',
  authenticate,
  redeemLimiter,
  redemptionController.redeemValidation,
  redemptionController.redeem
);

// 查询我的激活记录
router.get(
  '/my-activations',
  authenticate,
  redemptionController.getMyActivations
);

// 检查当前激活状态
router.get(
  '/check-status',
  authenticate,
  redemptionController.checkStatus
);

export default router;
