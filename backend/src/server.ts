import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config';
import logger from './utils/logger';
import { errorResponse } from './utils/response';

const app = express();

// 中间件
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// 健康检查
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 路由
import authRoutes from './routes/auth';
import redemptionRoutes from './routes/redemption';
import adminRoutes from './routes/admin';

app.use('/api/auth', authRoutes);
app.use('/api/redemption', redemptionRoutes);
app.use('/api/admin', adminRoutes);

// 404处理
app.use((_req: Request, res: Response) => {
  errorResponse(res, 'NOT_FOUND', '请求的资源不存在', 404);
});

// 全局错误处理
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
  errorResponse(res, 'INTERNAL_ERROR', '服务器内部错误', 500, {
    message: config.nodeEnv === 'development' ? err.message : undefined,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
  });
});

// 启动服务器
const startServer = async () => {
  try {
    app.listen(config.port, () => {
      logger.info(`🚀 服务器启动成功，端口: ${config.port}`);
      logger.info(`📝 环境: ${config.nodeEnv}`);
      logger.info(`🔗 CORS允许来源: ${config.cors.origin}`);
    });
  } catch (error) {
    logger.error('启动服务器失败:', error);
    process.exit(1);
  }
};

startServer();

export default app;
