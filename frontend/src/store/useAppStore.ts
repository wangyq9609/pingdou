import { create } from 'zustand';
import { User, Activation } from '../types';
import { authService } from '../services/authService';

interface AppState {
  // 用户相关
  user: User | null;
  isAuthenticated: boolean;
  activation: Activation | null;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setActivation: (activation: Activation | null) => void;
  setIsAuthenticated: (isAuth: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  // 初始状态
  user: null,
  isAuthenticated: false,
  activation: null,
  isLoading: true,

  // Setters
  setUser: (user) => set({ user }),
  setActivation: (activation) => set({ activation }),
  setIsAuthenticated: (isAuth) => set({ isAuthenticated: isAuth }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  // 登录
  login: async (email, password) => {
    try {
      const response = await authService.login(email, password);
      
      localStorage.setItem('accessToken', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);
      
      set({
        user: response.user,
        activation: response.activation,
        isAuthenticated: true,
      });
    } catch (error) {
      throw error;
    }
  },

  // 注册
  register: async (username, email, password) => {
    try {
      const response = await authService.register(username, email, password);
      
      localStorage.setItem('accessToken', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);
      
      set({
        user: response.user,
        activation: response.activation,
        isAuthenticated: true,
      });
    } catch (error) {
      throw error;
    }
  },

  // 登出
  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      // 忽略错误
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      set({
        user: null,
        activation: null,
        isAuthenticated: false,
      });
    }
  },

  // 初始化认证状态
  initializeAuth: async () => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const response = await authService.getMe();
      set({
        user: response.user,
        activation: response.activation,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({
        user: null,
        activation: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
