import { BeadColor, GridCell } from '../types';
import { RGB, rgbToLab, deltaE2000 } from './colorConverter';

// 调整图片尺寸
export async function resizeImage(
  image: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
): Promise<ImageData> {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法获取 Canvas 上下文');
  }

  // 使用高质量缩放
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  return ctx.getImageData(0, 0, targetWidth, targetHeight);
}

// 匹配到最接近的拼豆颜色
export function matchToBeadColor(rgb: RGB, palette: BeadColor[]): BeadColor {
  const targetLab = rgbToLab(rgb);
  let minDistance = Infinity;
  let closestColor = palette[0];

  for (const beadColor of palette) {
    const beadLab = rgbToLab(beadColor.rgb);
    const distance = deltaE2000(targetLab, beadLab);

    if (distance < minDistance) {
      minDistance = distance;
      closestColor = beadColor;
    }
  }

  return closestColor;
}

// K-means 颜色量化
export function quantizeColors(
  imageData: ImageData,
  palette: BeadColor[],
  maxColors: number = 16
): BeadColor[] {
  const pixels: RGB[] = [];
  const data = imageData.data;

  // 采样像素（每隔一定步长采样以提高性能）
  const step = Math.max(1, Math.floor(imageData.width * imageData.height / 10000));

  for (let i = 0; i < data.length; i += 4 * step) {
    pixels.push({
      r: data[i],
      g: data[i + 1],
      b: data[i + 2],
    });
  }

  // 统计每种颜色的使用频率
  const colorCounts = new Map<string, number>();

  for (const pixel of pixels) {
    const beadColor = matchToBeadColor(pixel, palette);
    const key = beadColor.id;
    colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
  }

  // 按使用频率排序
  const sortedColors = Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors)
    .map(([id]) => palette.find(c => c.id === id)!)
    .filter(Boolean);

  return sortedColors;
}

// 将图片转换为网格
export function imageToGrid(
  imageData: ImageData,
  palette: BeadColor[],
  width: number,
  height: number
): GridCell[][] {
  const grid: GridCell[][] = [];
  const data = imageData.data;

  for (let y = 0; y < height; y++) {
    const row: GridCell[] = [];
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const rgb: RGB = {
        r: data[index],
        g: data[index + 1],
        b: data[index + 2],
      };

      const beadColor = matchToBeadColor(rgb, palette);

      row.push({
        x,
        y,
        colorId: beadColor.id,
        color: beadColor,
      });
    }
    grid.push(row);
  }

  return grid;
}

// 计算颜色统计
export function calculateColorStats(grid: GridCell[][]): Map<string, { color: BeadColor; count: number }> {
  const stats = new Map<string, { color: BeadColor; count: number }>();

  for (const row of grid) {
    for (const cell of row) {
      const existing = stats.get(cell.colorId);
      if (existing) {
        existing.count++;
      } else {
        stats.set(cell.colorId, {
          color: cell.color,
          count: 1,
        });
      }
    }
  }

  return stats;
}

// 从 URL 加载图片
export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}

// 从 File 加载图片
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
