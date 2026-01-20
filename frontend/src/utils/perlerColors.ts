// 拼豆（Perler Beads）标准颜色调色板
// 基于 Perler 官方颜色系列

export interface PerlerColor {
  id: string;
  name: string;
  nameEn: string;
  rgb: { r: number; g: number; b: number };
  hex: string;
  available: boolean; // 是否常用/易获得
  brandCodes?: {
    MARD?: string;
    COCO?: string;
    漫漫?: string;
    盼盼?: string;
    咪小窝?: string;
  };
}

// 导入合并后的颜色系统
import { MERGED_COLORS } from '../data/beadColors';

// 获取所有可用颜色（使用合并后的颜色系统）
export function getAvailableColors(): PerlerColor[] {
  return MERGED_COLORS.filter(color => color.available);
}

// 根据 ID 查找颜色
export function getColorById(id: string): PerlerColor | undefined {
  return MERGED_COLORS.find(color => color.id === id);
}

// 根据 HEX 查找最接近的颜色
export function findClosestColor(hex: string, colors: PerlerColor[] = MERGED_COLORS): PerlerColor {
  // 这个函数会在图片处理模块中实现，使用颜色匹配算法
  return colors[0]; // 占位符
}

// 导出合并后的颜色数组（向后兼容）
export { MERGED_COLORS as PERLER_COLORS } from '../data/beadColors';
