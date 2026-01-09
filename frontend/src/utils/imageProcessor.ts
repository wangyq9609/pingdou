import { rgbToLab, deltaE2000, RGB } from './colorConverter';
import { PerlerColor, PERLER_COLORS } from './perlerColors';

// 像素数据接口
export interface PixelData {
  x: number;
  y: number;
  color: PerlerColor;
  originalRgb: RGB;
}

// 处理结果接口
export interface ProcessResult {
  pixels: PixelData[][];
  width: number;
  height: number;
  colorUsage: Map<string, number>; // 颜色使用统计
}

// 处理参数接口
export interface ProcessOptions {
  pixelSize: number; // 像素化尺寸（宽度像素数）
  colorPalette: PerlerColor[]; // 使用的颜色调色板
  dithering: boolean; // 是否启用抖动
  brightness: number; // 亮度调整 (-100 到 100)
  contrast: number; // 对比度调整 (-100 到 100)
}

// 默认处理参数
export const DEFAULT_OPTIONS: ProcessOptions = {
  pixelSize: 50,
  colorPalette: PERLER_COLORS.filter(c => c.available),
  dithering: false,
  brightness: 0,
  contrast: 0,
};

/**
 * 加载图片并转换为 ImageData
 */
export async function loadImageToImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      reject(new Error('文件不是有效的图片格式'));
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    
    // 设置超时，避免长时间等待
    const timeout = setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载超时，请检查文件是否损坏'));
    }, 30000); // 30秒超时
    
    img.onload = () => {
      clearTimeout(timeout);
      try {
        // 检查图片尺寸是否合理
        if (img.width === 0 || img.height === 0) {
          URL.revokeObjectURL(url);
          reject(new Error('图片尺寸无效'));
          return;
        }

        // 限制最大尺寸，避免内存问题
        const maxDimension = 5000;
        if (img.width > maxDimension || img.height > maxDimension) {
          URL.revokeObjectURL(url);
          reject(new Error(`图片尺寸过大，最大支持 ${maxDimension}x${maxDimension} 像素`));
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('无法创建画布上下文，请检查浏览器支持'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(imageData);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error instanceof Error ? error : new Error('图片处理失败'));
      }
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败，请检查文件是否损坏或格式不支持'));
    };
    
    img.src = url;
  });
}

/**
 * 调整亮度和对比度
 */
function adjustBrightnessContrast(
  imageData: ImageData,
  brightness: number,
  contrast: number
): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  
  for (let i = 0; i < data.length; i += 4) {
    // 亮度调整
    data[i] = Math.max(0, Math.min(255, data[i] + brightness));     // R
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + brightness)); // G
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + brightness)); // B
    
    // 对比度调整
    data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
    data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
    data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
  }
  
  return new ImageData(data, imageData.width, imageData.height);
}

/**
 * 使用 CIEDE2000 算法找到最接近的拼豆颜色
 */
function findClosestPerlerColor(rgb: RGB, palette: PerlerColor[]): PerlerColor {
  const lab = rgbToLab(rgb);
  let minDeltaE = Infinity;
  let closestColor = palette[0];
  
  for (const color of palette) {
    const colorLab = rgbToLab(color.rgb);
    const deltaE = deltaE2000(lab, colorLab);
    
    if (deltaE < minDeltaE) {
      minDeltaE = deltaE;
      closestColor = color;
    }
  }
  
  return closestColor;
}

/**
 * 降采样：将图片缩小到指定像素尺寸
 */
function downsample(
  imageData: ImageData,
  targetWidth: number
): ImageData {
  const sourceWidth = imageData.width;
  const sourceHeight = imageData.height;
  const scale = sourceWidth / targetWidth;
  const targetHeight = Math.round(sourceHeight / scale);
  
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('无法创建画布上下文');
  }
  
  // 使用高质量缩放
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // 创建临时画布绘制原图
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = sourceWidth;
  tempCanvas.height = sourceHeight;
  const tempCtx = tempCanvas.getContext('2d');
  if (tempCtx) {
    tempCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
  }
  
  return ctx.getImageData(0, 0, targetWidth, targetHeight);
}

/**
 * 简单的 Floyd-Steinberg 抖动算法
 */
function applyDithering(
  imageData: ImageData,
  palette: PerlerColor[]
): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const width = imageData.width;
  const height = imageData.height;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const rgb: RGB = {
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2],
      };
      
      // 找到最接近的颜色
      const closest = findClosestPerlerColor(rgb, palette);
      const quantizedRgb = closest.rgb;
      
      // 计算误差
      const errorR = rgb.r - quantizedRgb.r;
      const errorG = rgb.g - quantizedRgb.g;
      const errorB = rgb.b - quantizedRgb.b;
      
      // 设置当前像素
      data[idx] = quantizedRgb.r;
      data[idx + 1] = quantizedRgb.g;
      data[idx + 2] = quantizedRgb.b;
      
      // 扩散误差到相邻像素
      const distributeError = (nx: number, ny: number, factor: number) => {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nIdx = (ny * width + nx) * 4;
          data[nIdx] = Math.max(0, Math.min(255, data[nIdx] + errorR * factor));
          data[nIdx + 1] = Math.max(0, Math.min(255, data[nIdx + 1] + errorG * factor));
          data[nIdx + 2] = Math.max(0, Math.min(255, data[nIdx + 2] + errorB * factor));
        }
      };
      
      // Floyd-Steinberg 误差扩散
      distributeError(x + 1, y, 7 / 16);
      distributeError(x - 1, y + 1, 3 / 16);
      distributeError(x, y + 1, 5 / 16);
      distributeError(x + 1, y + 1, 1 / 16);
    }
  }
  
  return new ImageData(data, width, height);
}

/**
 * 主处理函数：将图片转换为拼豆像素图
 */
export async function processImageToPerler(
  file: File,
  options: ProcessOptions = DEFAULT_OPTIONS
): Promise<ProcessResult> {
  // 1. 加载图片
  let imageData = await loadImageToImageData(file);
  
  // 2. 调整亮度和对比度
  if (options.brightness !== 0 || options.contrast !== 0) {
    imageData = adjustBrightnessContrast(
      imageData,
      options.brightness,
      options.contrast
    );
  }
  
  // 3. 降采样到目标尺寸
  imageData = downsample(imageData, options.pixelSize);
  
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  
  // 4. 颜色量化（是否使用抖动）
  if (options.dithering) {
    imageData = applyDithering(imageData, options.colorPalette);
  }
  
  // 5. 转换为像素数据
  const pixels: PixelData[][] = [];
  const colorUsage = new Map<string, number>();
  
  for (let y = 0; y < height; y++) {
    const row: PixelData[] = [];
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const rgb: RGB = {
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2],
      };
      
      // 找到最接近的拼豆颜色
      const perlerColor = findClosestPerlerColor(rgb, options.colorPalette);
      
      // 统计颜色使用
      const count = colorUsage.get(perlerColor.id) || 0;
      colorUsage.set(perlerColor.id, count + 1);
      
      row.push({
        x,
        y,
        color: perlerColor,
        originalRgb: rgb,
      });
    }
    pixels.push(row);
  }
  
  return {
    pixels,
    width,
    height,
    colorUsage,
  };
}

/**
 * 生成材料清单
 */
export interface MaterialItem {
  color: PerlerColor;
  count: number;
}

export function generateMaterialList(result: ProcessResult, palette: PerlerColor[]): MaterialItem[] {
  const items: MaterialItem[] = [];
  
  result.colorUsage.forEach((count, colorId) => {
    const color = palette.find(c => c.id === colorId);
    if (color) {
      items.push({ color, count });
    }
  });
  
  // 按使用数量排序
  items.sort((a, b) => b.count - a.count);
  
  return items;
}
