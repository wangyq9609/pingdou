import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error: AxiosError<any>) => {
    const { response } = error;

    if (response) {
      const { status, data } = response;

      // Token过期，尝试刷新
      if (status === 401 && data?.error?.code === 'INVALID_TOKEN') {
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const result = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
              refreshToken,
            });

            const { accessToken } = result.data.data;
            localStorage.setItem('accessToken', accessToken);

            // 重试原请求
            if (error.config) {
              error.config.headers.Authorization = `Bearer ${accessToken}`;
              return apiClient(error.config);
            }
          }
        } catch (refreshError) {
          // 刷新失败，清除token并跳转登录
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      // 显示错误消息
      const errorMessage = data?.error?.message || '请求失败';
      message.error(errorMessage);

      return Promise.reject(data);
    }

    message.error('网络错误，请稍后重试');
    return Promise.reject(error);
  }
);

export default apiClient;
