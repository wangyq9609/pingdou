import apiClient from '../utils/apiClient';
import { AuthResponse, User, Activation } from '../types';

export const authService = {
  // 注册
  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<any, any>('/auth/register', {
      username,
      email,
      password,
    });
    return response.data;
  },

  // 登录
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<any, any>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  // 获取当前用户信息
  async getMe(): Promise<{ user: User; activation: Activation | null }> {
    const response = await apiClient.get<any, any>('/auth/me');
    return response.data;
  },

  // 登出
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  // 刷新令牌
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await apiClient.post<any, any>('/auth/refresh-token', {
      refreshToken,
    });
    return response.data;
  },
};
