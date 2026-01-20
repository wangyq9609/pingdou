// 用户类型
export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

// 激活信息
export interface Activation {
  codeType: string;
  codeTypeName: string;
  expiresAt: string;
  daysLeft?: number;
}

// 认证响应
export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  activation: Activation | null;
}

// 拼豆颜色
export interface BeadColor {
  id: string;
  brand: string;
  name: string;
  rgb: { r: number; g: number; b: number };
  hex: string;
  available: boolean;
}

// 网格单元
export interface GridCell {
  x: number;
  y: number;
  colorId: string;
  color: BeadColor;
}

// 项目配置
export interface ProjectConfig {
  width: number;
  height: number;
  colorCount: number;
  selectedPalette: string; // 'Perler', 'Hama'
}

// 项目
export interface Project {
  id: string;
  projectName: string;
  originalImageUrl?: string;
  config: ProjectConfig;
  gridData: GridCell[][];
  colorPalette: BeadColor[];
  createdAt: string;
  updatedAt: string;
}

// API响应
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
