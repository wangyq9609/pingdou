import { create } from 'zustand';
import { User, Activation, BeadColor, GridCell, Project } from '../types';
import { authService } from '../services/authService';

interface AppState {
  // 用户相关
  user: User | null;
  isAuthenticated: boolean;
  activation: Activation | null;
  isLoading: boolean;

  // 工作区相关
  currentProject: Project | null;
  originalImage: HTMLImageElement | null;
  gridData: GridCell[][] | null;
  selectedPalette: BeadColor[];

  // 配置
  gridSize: { width: number; height: number };
  colorCount: number;
  showGrid: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setActivation: (activation: Activation | null) => void;
  setIsAuthenticated: (isAuth: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  
  setOriginalImage: (image: HTMLImageElement | null) => void;
  setGridData: (data: GridCell[][] | null) => void;
  setSelectedPalette: (palette: BeadColor[]) => void;
  setGridSize: (size: { width: number; height: number }) => void;
  setColorCount: (count: number) => void;
  setShowGrid: (show: boolean) => void;
  setCurrentProject: (project: Project | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // 初始状态
  user: null,
  isAuthenticated: false,
  activation: null,
  isLoading: true,
  
  currentProject: null,
  originalImage: null,
  gridData: null,
  selectedPalette: [],
  
  gridSize: { width: 29, height: 29 },
  colorCount: 16,
  showGrid: true,

  // Setters
  setUser: (user) => set({ user }),
  setActivation: (activation) => set({ activation }),
  setIsAuthenticated: (isAuth) => set({ isAuthenticated: isAuth }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  setOriginalImage: (image) => set({ originalImage: image }),
  setGridData: (data) => set({ gridData: data }),
  setSelectedPalette: (palette) => set({ selectedPalette: palette }),
  setGridSize: (size) => set({ gridSize: size }),
  setColorCount: (count) => set({ colorCount: count }),
  setShowGrid: (show) => set({ showGrid: show }),
  setCurrentProject: (project) => set({ currentProject: project }),

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
        currentProject: null,
        originalImage: null,
        gridData: null,
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
