// 本地存储工具
import { DitheringMethod } from './imageProcessor';

export interface SavedSettings {
  gridSize: { width: number; height: number };
  colorCount: number;
  contrast: number;
  brightness: number;
  saturation: number;
  sharpen: boolean;
  ditheringMethod: DitheringMethod;
  useDithering: boolean;
  brand: 'Perler' | 'Hama';
  showGrid: boolean;
  preserveColors?: boolean; // 精确颜色模式（可选，向后兼容）
}

const STORAGE_KEY = 'pingdou_settings';

// 保存设置
export function saveSettings(settings: SavedSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('保存设置失败:', error);
  }
}

// 加载设置
export function loadSettings(): SavedSettings | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('加载设置失败:', error);
  }
  return null;
}

// 清除设置
export function clearSettings(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('清除设置失败:', error);
  }
}

// 导出配置
export function exportSettings(settings: SavedSettings, filename: string = 'pingdou_config.json'): void {
  try {
    const json = JSON.stringify(settings, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('导出配置失败:', error);
  }
}

// 导入配置
export function importSettings(file: File): Promise<SavedSettings> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        resolve(settings);
      } catch (error) {
        reject(new Error('无效的配置文件'));
      }
    };
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsText(file);
  });
}
