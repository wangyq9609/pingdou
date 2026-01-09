// 拼豆（Perler Beads）标准颜色调色板
// 基于 Perler 官方颜色系列

export interface PerlerColor {
  id: string;
  name: string;
  nameEn: string;
  rgb: { r: number; g: number; b: number };
  hex: string;
  available: boolean; // 是否常用/易获得
}

// Perler 标准颜色调色板（包含最常用的颜色）
export const PERLER_COLORS: PerlerColor[] = [
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

// 获取所有可用颜色
export function getAvailableColors(): PerlerColor[] {
  return PERLER_COLORS.filter(color => color.available);
}

// 根据 ID 查找颜色
export function getColorById(id: string): PerlerColor | undefined {
  return PERLER_COLORS.find(color => color.id === id);
}

// 根据 HEX 查找最接近的颜色
export function findClosestColor(hex: string, colors: PerlerColor[] = PERLER_COLORS): PerlerColor {
  // 这个函数会在图片处理模块中实现，使用颜色匹配算法
  return colors[0]; // 占位符
}
