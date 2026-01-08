import { createClient } from 'redis';
import { config } from '../config';
import logger from './logger';

const redisClient = createClient({
  url: config.redis.url,
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('✅ Redis连接成功');
});

// 连接Redis
export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Redis连接失败:', error);
  }
};

export default redisClient;
