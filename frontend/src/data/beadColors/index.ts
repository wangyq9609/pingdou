// 颜色系统映射数据加载和转换
import colorSystemMapping from './colorSystemMapping.json';
import type { PerlerColor } from '../../utils/perlerColors';

// 原始颜色定义（避免循环依赖）
const BASE_PERLER_COLORS: PerlerColor[] = [
  // 基础色
  { id: 'white', name: '白色', nameEn: 'White', rgb: { r: 255, g: 255, b: 255 }, hex: '#FFFFFF', available: true },
  { id: 'black', name: '黑色', nameEn: 'Black', rgb: { r: 0, g: 0, b: 0 }, hex: '#000000', available: true },
  { id: 'red', name: '红色', nameEn: 'Red', rgb: { r: 220, g: 20, b: 60 }, hex: '#DC143C', available: true },
  { id: 'blue', name: '蓝色', nameEn: 'Blue', rgb: { r: 0, g: 0, b: 255 }, hex: '#0000FF', available: true },
  { id: 'yellow', name: '黄色', nameEn: 'Yellow', rgb: { r: 255, g: 255, b: 0 }, hex: '#FFFF00', available: true },
  { id: 'green', name: '绿色', nameEn: 'Green', rgb: { r: 0, g: 128, b: 0 }, hex: '#008000', available: true },
  
  // 扩展色
  { id: 'orange', name: '橙色', nameEn: 'Orange', rgb: { r: 255, g: 165, b: 0 }, hex: '#FFA500', available: true },
  { id: 'purple', name: '紫色', nameEn: 'Purple', rgb: { r: 128, g: 0, b: 128 }, hex: '#800080', available: true },
  { id: 'pink', name: '粉色', nameEn: 'Pink', rgb: { r: 255, g: 192, b: 203 }, hex: '#FFC0CB', available: true },
  { id: 'brown', name: '棕色', nameEn: 'Brown', rgb: { r: 139, g: 69, b: 19 }, hex: '#8B4513', available: true },
  { id: 'gray', name: '灰色', nameEn: 'Gray', rgb: { r: 128, g: 128, b: 128 }, hex: '#808080', available: true },
  { id: 'light-blue', name: '浅蓝色', nameEn: 'Light Blue', rgb: { r: 173, g: 216, b: 230 }, hex: '#ADD8E6', available: true },
  
  // 更多常用色
  { id: 'light-green', name: '浅绿色', nameEn: 'Light Green', rgb: { r: 144, g: 238, b: 144 }, hex: '#90EE90', available: true },
  { id: 'dark-blue', name: '深蓝色', nameEn: 'Dark Blue', rgb: { r: 0, g: 0, b: 139 }, hex: '#00008B', available: true },
  { id: 'dark-green', name: '深绿色', nameEn: 'Dark Green', rgb: { r: 0, g: 100, b: 0 }, hex: '#006400', available: true },
  { id: 'dark-red', name: '深红色', nameEn: 'Dark Red', rgb: { r: 139, g: 0, b: 0 }, hex: '#8B0000', available: true },
  { id: 'light-yellow', name: '浅黄色', nameEn: 'Light Yellow', rgb: { r: 255, g: 255, b: 224 }, hex: '#FFFFE0', available: true },
  { id: 'light-pink', name: '浅粉色', nameEn: 'Light Pink', rgb: { r: 255, g: 182, b: 193 }, hex: '#FFB6C1', available: true },
  
  // 特殊色
  { id: 'cyan', name: '青色', nameEn: 'Cyan', rgb: { r: 0, g: 255, b: 255 }, hex: '#00FFFF', available: true },
  { id: 'magenta', name: '品红色', nameEn: 'Magenta', rgb: { r: 255, g: 0, b: 255 }, hex: '#FF00FF', available: true },
  { id: 'lime', name: '酸橙绿', nameEn: 'Lime', rgb: { r: 0, g: 255, b: 0 }, hex: '#00FF00', available: true },
  { id: 'navy', name: '海军蓝', nameEn: 'Navy', rgb: { r: 0, g: 0, b: 128 }, hex: '#000080', available: true },
  { id: 'maroon', name: '栗色', nameEn: 'Maroon', rgb: { r: 128, g: 0, b: 0 }, hex: '#800000', available: true },
  { id: 'olive', name: '橄榄绿', nameEn: 'Olive', rgb: { r: 128, g: 128, b: 0 }, hex: '#808000', available: true },
  { id: 'teal', name: '青绿色', nameEn: 'Teal', rgb: { r: 0, g: 128, b: 128 }, hex: '#008080', available: true },
  { id: 'silver', name: '银色', nameEn: 'Silver', rgb: { r: 192, g: 192, b: 192 }, hex: '#C0C0C0', available: true },
  { id: 'gold', name: '金色', nameEn: 'Gold', rgb: { r: 255, g: 215, b: 0 }, hex: '#FFD700', available: true },
];

// 将十六进制颜色转换为RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

// 生成颜色ID（基于MARD色号或hex值）
function generateColorId(hex: string, mardCode?: string): string {
  if (mardCode) {
    return `mard-${mardCode.toLowerCase()}`;
  }
  return `color-${hex.replace('#', '').toLowerCase()}`;
}

// 生成颜色名称（基于MARD色号）
function generateColorName(mardCode?: string, hex?: string): string {
  if (mardCode) {
    return `MARD ${mardCode}`;
  }
  return `颜色 ${hex}`;
}

// 将JSON映射数据转换为PerlerColor数组
function convertMappingToColors(): PerlerColor[] {
  const colors: PerlerColor[] = [];
  const mapping = colorSystemMapping as Record<string, Record<string, string>>;

  for (const [hex, brandCodes] of Object.entries(mapping)) {
    const rgb = hexToRgb(hex);
    const mardCode = brandCodes.MARD;
    const id = generateColorId(hex, mardCode);
    const name = generateColorName(mardCode, hex);
    const nameEn = mardCode ? `MARD ${mardCode}` : `Color ${hex}`;

    colors.push({
      id,
      name,
      nameEn,
      rgb,
      hex: hex.toUpperCase(),
      available: true,
      brandCodes: {
        MARD: brandCodes.MARD,
        COCO: brandCodes.COCO,
        漫漫: brandCodes.漫漫,
        盼盼: brandCodes.盼盼,
        咪小窝: brandCodes.咪小窝,
      },
    });
  }

  return colors;
}

// 合并现有颜色和映射颜色
export function mergeColorSystems(): PerlerColor[] {
  const mappingColors = convertMappingToColors();
  const mergedColors: PerlerColor[] = [];
  const colorMap = new Map<string, PerlerColor>();

  // 首先添加所有映射颜色
  for (const color of mappingColors) {
    colorMap.set(color.hex.toUpperCase(), color);
  }

  // 然后处理现有颜色，如果hex匹配则合并品牌色号，否则添加新颜色
  for (const existingColor of BASE_PERLER_COLORS) {
    const hexUpper = existingColor.hex.toUpperCase();
    const mappedColor = colorMap.get(hexUpper);

    if (mappedColor) {
      // 如果存在映射，合并信息（保留现有颜色的id、name等，但添加品牌色号）
      mergedColors.push({
        ...existingColor,
        brandCodes: mappedColor.brandCodes,
      });
      colorMap.delete(hexUpper); // 标记已处理
    } else {
      // 如果不存在映射，保留原颜色
      mergedColors.push(existingColor);
    }
  }

  // 添加剩余的映射颜色（在现有颜色中不存在的）
  for (const color of colorMap.values()) {
    mergedColors.push(color);
  }

  return mergedColors;
}

// 导出合并后的颜色数组
export const MERGED_COLORS = mergeColorSystems();

// 导出为PERLER_COLORS以保持向后兼容
export { MERGED_COLORS as PERLER_COLORS };
