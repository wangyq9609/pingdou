import prisma from '../db';
import { generateBatchCodes, validateCodeFormat } from '../utils/codeGenerator';
import { CODE_TYPES } from '../types';
import logger from '../utils/logger';

export class RedemptionService {
  // 兑换激活码
  async redeemCode(userId: number, code: string, ipAddress?: string, userAgent?: string) {
    // 验证格式
    if (!validateCodeFormat(code)) {
      await this.logRedemption(userId, null, 'redeem', 'failure', '兑换码格式错误', ipAddress, userAgent);
      throw new Error('INVALID_CODE_FORMAT');
    }

    // 查询兑换码
    const redemptionCode = await prisma.redemptionCode.findUnique({
      where: { code }
    });

    if (!redemptionCode) {
      await this.logRedemption(userId, null, 'redeem', 'failure', '兑换码不存在', ipAddress, userAgent);
      throw new Error('CODE_NOT_FOUND');
    }

    // 检查状态
    if (redemptionCode.status !== 'unused') {
      await this.logRedemption(userId, redemptionCode.id, 'redeem', 'failure', `兑换码状态: ${redemptionCode.status}`, ipAddress, userAgent);
      throw new Error('CODE_ALREADY_USED');
    }

    // 检查兑换码有效期
    if (redemptionCode.validUntil && redemptionCode.validUntil < new Date()) {
      await prisma.redemptionCode.update({
        where: { id: redemptionCode.id },
        data: { status: 'expired' }
      });
      await this.logRedemption(userId, redemptionCode.id, 'redeem', 'failure', '兑换码已过期', ipAddress, userAgent);
      throw new Error('CODE_EXPIRED');
    }

    // 检查是否已经兑换过此码
    const existingActivation = await prisma.userActivation.findFirst({
      where: {
        userId: BigInt(userId),
        redemptionCodeId: redemptionCode.id
      }
    });

    if (existingActivation) {
      await this.logRedemption(userId, redemptionCode.id, 'redeem', 'failure', '用户已兑换过此码', ipAddress, userAgent);
      throw new Error('USER_ALREADY_REDEEMED');
    }

    // 开始事务
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 更新兑换码状态
        await tx.redemptionCode.update({
          where: { id: redemptionCode.id },
          data: {
            status: 'used',
            currentUsageCount: redemptionCode.currentUsageCount + 1
          }
        });

        // 计算到期时间
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + redemptionCode.durationDays);

        // 创建激活记录
        const activation = await tx.userActivation.create({
          data: {
            userId: BigInt(userId),
            redemptionCodeId: redemptionCode.id,
            codeType: redemptionCode.codeType,
            expiresAt,
            isActive: true
          }
        });

        return activation;
      });

      // 记录成功日志
      await this.logRedemption(userId, redemptionCode.id, 'redeem', 'success', null, ipAddress, userAgent);

      logger.info(`Code redeemed: ${code} by user ${userId}`);

      const codeTypeConfig = CODE_TYPES[redemptionCode.codeType];

      return {
        activation: {
          id: result.id.toString(),
          codeType: result.codeType,
          codeTypeName: codeTypeConfig?.name || result.codeType,
          activatedAt: result.activatedAt.toISOString(),
          expiresAt: result.expiresAt.toISOString(),
          daysRemaining: redemptionCode.durationDays
        }
      };
    } catch (error) {
      await this.logRedemption(userId, redemptionCode.id, 'redeem', 'failure', '事务失败', ipAddress, userAgent);
      throw error;
    }
  }

  // 查询用户的激活记录
  async getMyActivations(userId: number) {
    const activations = await prisma.userActivation.findMany({
      where: {
        userId: BigInt(userId)
      },
      include: {
        redemptionCode: true
      },
      orderBy: {
        activatedAt: 'desc'
      }
    });

    return activations.map(activation => {
      const codeTypeConfig = CODE_TYPES[activation.codeType];
      const isExpired = activation.expiresAt < new Date();
      
      return {
        id: activation.id.toString(),
        codeType: activation.codeType,
        codeTypeName: codeTypeConfig?.name || activation.codeType,
        code: activation.redemptionCode.code.replace(/(.{4})-(.{4})-(.{4})-(.{4})/, '$1-****-****-$4'), // 脱敏
        activatedAt: activation.activatedAt.toISOString(),
        expiresAt: activation.expiresAt.toISOString(),
        isActive: activation.isActive && !isExpired,
        isExpired
      };
    });
  }

  // 检查当前激活状态
  async checkStatus(userId: number) {
    const activation = await prisma.userActivation.findFirst({
      where: {
        userId: BigInt(userId),
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      orderBy: {
        expiresAt: 'desc'
      }
    });

    if (!activation) {
      return {
        isActive: false,
        message: '当前没有有效的激活'
      };
    }

    const codeTypeConfig = CODE_TYPES[activation.codeType];
    const daysLeft = Math.ceil((activation.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return {
      isActive: true,
      codeType: activation.codeType,
      codeTypeName: codeTypeConfig?.name || activation.codeType,
      expiresAt: activation.expiresAt.toISOString(),
      daysLeft
    };
  }

  // 生成兑换码（管理员）
  async generateCodes(
    codeType: string,
    quantity: number,
    batchId?: string,
    validUntil?: Date,
    createdById?: number
  ) {
    // 验证codeType
    if (!CODE_TYPES[codeType]) {
      throw new Error('INVALID_CODE_TYPE');
    }

    const codeTypeConfig = CODE_TYPES[codeType];
    const codes = generateBatchCodes(quantity);

    const redemptionCodes = await prisma.redemptionCode.createMany({
      data: codes.map(code => ({
        code,
        codeType,
        durationDays: codeTypeConfig.durationDays,
        batchId: batchId || `BATCH_${Date.now()}`,
        status: 'unused',
        validUntil,
        createdById: createdById ? BigInt(createdById) : null
      }))
    });

    logger.info(`Generated ${quantity} codes of type ${codeType}`);

    return {
      count: redemptionCodes.count,
      codes,
      codeType,
      codeTypeName: codeTypeConfig.name,
      batchId: batchId || `BATCH_${Date.now()}`
    };
  }

  // 查询兑换码列表（管理员）
  async listCodes(page: number = 1, limit: number = 20, status?: string, batchId?: string) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (status) where.status = status;
    if (batchId) where.batchId = batchId;

    const [codes, total] = await Promise.all([
      prisma.redemptionCode.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          activations: {
            include: {
              user: {
                select: {
                  username: true,
                  email: true
                }
              }
            }
          }
        }
      }),
      prisma.redemptionCode.count({ where })
    ]);

    return {
      codes: codes.map(code => ({
        id: code.id.toString(),
        code: code.code,
        codeType: code.codeType,
        codeTypeName: CODE_TYPES[code.codeType]?.name || code.codeType,
        durationDays: code.durationDays,
        batchId: code.batchId,
        status: code.status,
        maxUsageCount: code.maxUsageCount,
        currentUsageCount: code.currentUsageCount,
        validFrom: code.validFrom.toISOString(),
        validUntil: code.validUntil?.toISOString(),
        createdAt: code.createdAt.toISOString(),
        usedBy: code.activations.map(a => ({
          username: a.user.username,
          email: a.user.email,
          activatedAt: a.activatedAt.toISOString()
        }))
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // 撤销兑换码（管理员）
  async revokeCode(codeId: number) {
    const code = await prisma.redemptionCode.findUnique({
      where: { id: BigInt(codeId) }
    });

    if (!code) {
      throw new Error('CODE_NOT_FOUND');
    }

    await prisma.$transaction(async (tx) => {
      // 更新兑换码状态
      await tx.redemptionCode.update({
        where: { id: BigInt(codeId) },
        data: { status: 'revoked' }
      });

      // 停用所有相关激活
      await tx.userActivation.updateMany({
        where: { redemptionCodeId: BigInt(codeId) },
        data: { isActive: false }
      });
    });

    logger.info(`Code revoked: ${codeId}`);

    return { message: '兑换码已撤销' };
  }

  // 记录兑换日志
  private async logRedemption(
    userId: number,
    redemptionCodeId: bigint | null,
    action: string,
    result: string,
    errorMessage?: string | null,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      await prisma.redemptionLog.create({
        data: {
          userId: BigInt(userId),
          redemptionCodeId,
          action,
          ipAddress,
          userAgent,
          result,
          errorMessage
        }
      });
    } catch (error) {
      logger.error('Failed to log redemption:', error);
    }
  }
}
