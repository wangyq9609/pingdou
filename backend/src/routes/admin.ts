import { Router } from 'express';
import * as redemptionController from '../controllers/redemptionController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// 所有管理员路由都需要认证
router.use(authenticate);

// 生成兑换码
router.post(
  '/redemption/generate',
  redemptionController.generateCodesValidation,
  redemptionController.generateCodes
);

// 查询兑换码列表
router.get(
  '/redemption/list',
  redemptionController.listCodesValidation,
  redemptionController.listCodes
);

// 撤销兑换码
router.post(
  '/redemption/revoke/:id',
  redemptionController.revokeCode
);

export default router;
