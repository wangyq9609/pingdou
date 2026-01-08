import { BeadColor } from '../types';

// Perler 色板
export const PERLER_PALETTE: BeadColor[] = [
  { id: 'P01', brand: 'Perler', name: '白色 White', rgb: { r: 241, g: 241, b: 241 }, hex: '#F1F1F1', available: true },
  { id: 'P02', brand: 'Perler', name: '奶油色 Cream', rgb: { r: 224, g: 222, b: 169 }, hex: '#E0DEA9', available: true },
  { id: 'P03', brand: 'Perler', name: '黄色 Yellow', rgb: { r: 236, g: 216, b: 0 }, hex: '#ECD800', available: true },
  { id: 'P04', brand: 'Perler', name: '橙色 Orange', rgb: { r: 237, g: 97, b: 32 }, hex: '#ED6120', available: true },
  { id: 'P05', brand: 'Perler', name: '红色 Red', rgb: { r: 221, g: 8, b: 25 }, hex: '#DD0819', available: true },
  { id: 'P06', brand: 'Perler', name: '泡泡糖粉 Bubblegum', rgb: { r: 228, g: 72, b: 146 }, hex: '#E44892', available: true },
  { id: 'P07', brand: 'Perler', name: '紫色 Purple', rgb: { r: 96, g: 64, b: 137 }, hex: '#604089', available: true },
  { id: 'P08', brand: 'Perler', name: '深蓝 Dark Blue', rgb: { r: 43, g: 63, b: 135 }, hex: '#2B3F87', available: true },
  { id: 'P09', brand: 'Perler', name: '浅蓝 Light Blue', rgb: { r: 51, g: 112, b: 192 }, hex: '#3370C0', available: true },
  { id: 'P10', brand: 'Perler', name: '深绿 Dark Green', rgb: { r: 1, g: 114, b: 41 }, hex: '#017229', available: true },
  { id: 'P11', brand: 'Perler', name: '亮绿 Bright Green', rgb: { r: 87, g: 166, b: 57 }, hex: '#57A639', available: true },
  { id: 'P12', brand: 'Perler', name: '棕色 Brown', rgb: { r: 84, g: 42, b: 55 }, hex: '#542A37', available: true },
  { id: 'P13', brand: 'Perler', name: '灰色 Grey', rgb: { r: 138, g: 141, b: 145 }, hex: '#8A8D91', available: true },
  { id: 'P14', brand: 'Perler', name: '黑色 Black', rgb: { r: 70, g: 70, b: 70 }, hex: '#464646', available: true },
  { id: 'P15', brand: 'Perler', name: '桃色 Peach', rgb: { r: 238, g: 186, b: 178 }, hex: '#EEBAB2', available: true },
  { id: 'P16', brand: 'Perler', name: '淡紫 Light Pink', rgb: { r: 246, g: 179, b: 221 }, hex: '#F6B3DD', available: true },
];

// Hama 色板
export const HAMA_PALETTE: BeadColor[] = [
  { id: 'H01', brand: 'Hama', name: '白色 White', rgb: { r: 240, g: 240, b: 240 }, hex: '#F0F0F0', available: true },
  { id: 'H02', brand: 'Hama', name: '奶油色 Cream', rgb: { r: 242, g: 228, b: 160 }, hex: '#F2E4A0', available: true },
  { id: 'H03', brand: 'Hama', name: '黄色 Yellow', rgb: { r: 255, g: 222, b: 0 }, hex: '#FFDE00', available: true },
  { id: 'H04', brand: 'Hama', name: '橙色 Orange', rgb: { r: 246, g: 106, b: 26 }, hex: '#F66A1A', available: true },
  { id: 'H05', brand: 'Hama', name: '红色 Red', rgb: { r: 207, g: 16, b: 42 }, hex: '#CF102A', available: true },
  { id: 'H06', brand: 'Hama', name: '粉色 Pink', rgb: { r: 244, g: 121, b: 192 }, hex: '#F479C0', available: true },
  { id: 'H07', brand: 'Hama', name: '紫色 Purple', rgb: { r: 126, g: 60, b: 147 }, hex: '#7E3C93', available: true },
  { id: 'H08', brand: 'Hama', name: '深蓝 Dark Blue', rgb: { r: 25, g: 57, b: 138 }, hex: '#19398A', available: true },
  { id: 'H09', brand: 'Hama', name: '蓝色 Blue', rgb: { r: 57, g: 144, b: 213 }, hex: '#3990D5', available: true },
  { id: 'H10', brand: 'Hama', name: '深绿 Dark Green', rgb: { r: 25, g: 118, b: 69 }, hex: '#197645', available: true },
  { id: 'H11', brand: 'Hama', name: '绿色 Green', rgb: { r: 101, g: 178, b: 73 }, hex: '#65B249', available: true },
  { id: 'H12', brand: 'Hama', name: '棕色 Brown', rgb: { r: 114, g: 46, b: 25 }, hex: '#722E19', available: true },
  { id: 'H13', brand: 'Hama', name: '灰色 Grey', rgb: { r: 137, g: 141, b: 144 }, hex: '#898D90', available: true },
  { id: 'H14', brand: 'Hama', name: '黑色 Black', rgb: { r: 43, g: 43, b: 43 }, hex: '#2B2B2B', available: true },
  { id: 'H15', brand: 'Hama', name: '肤色 Skin', rgb: { r: 253, g: 201, b: 177 }, hex: '#FDC9B1', available: true },
  { id: 'H16', brand: 'Hama', name: '淡粉 Light Pink', rgb: { r: 253, g: 196, b: 217 }, hex: '#FDC4D9', available: true },
];

// 所有色板
export const ALL_PALETTES = {
  Perler: PERLER_PALETTE,
  Hama: HAMA_PALETTE,
};

// 获取色板
export const getPalette = (brand: string): BeadColor[] => {
  return ALL_PALETTES[brand as keyof typeof ALL_PALETTES] || PERLER_PALETTE;
};

// 获取可用颜色
export const getAvailableColors = (palette: BeadColor[]): BeadColor[] => {
  return palette.filter(color => color.available);
};
