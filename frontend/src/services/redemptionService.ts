import apiClient from '../utils/apiClient';
import { Activation } from '../types';

export const redemptionService = {
  // 兑换激活码
  async redeem(code: string): Promise<{ activation: Activation }> {
    const response = await apiClient.post<any, any>('/redemption/redeem', {
      code: code.toUpperCase(),
    });
    return response.data;
  },

  // 查询我的激活记录
  async getMyActivations(): Promise<{ activations: Activation[] }> {
    const response = await apiClient.get<any, any>('/redemption/my-activations');
    return response.data;
  },

  // 检查激活状态
  async checkStatus(): Promise<Activation | { isActive: false; message: string }> {
    const response = await apiClient.get<any, any>('/redemption/check-status');
    return response.data;
  },
};
