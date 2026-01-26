import { rgbToLab, deltaE2000, RGB } from './colorConverter';
import { PerlerColor, PERLER_COLORS } from './perlerColors';
import { bicubicResize } from './bicubicInterpolation';

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
  useBicubic?: boolean; // 是否使用双三次插值（默认 true）
  minColorCount?: number; // 最小颜色使用数量（低于此数量的颜色会被替换为相似颜色）
  maxColorTypes?: number; // 最大颜色种类数（0表示不限制）
}

// 默认处理参数
export const DEFAULT_OPTIONS: ProcessOptions = {
  pixelSize: 100,
  colorPalette: PERLER_COLORS.filter(c => c.available),
  dithering: false,
  brightness: 0,
  contrast: 0,
  minColorCount: 0, // 默认不过滤
  maxColorTypes: 0, // 默认不限制
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
 * 使用双三次插值进行高质量缩放
 */
function downsample(
  imageData: ImageData,
  targetWidth: number,
  useBicubic: boolean = true
): ImageData {
  const sourceWidth = imageData.width;
  const sourceHeight = imageData.height;
  const scale = sourceWidth / targetWidth;
  const targetHeight = Math.round(sourceHeight / scale);

  // 如果目标尺寸大于等于源尺寸，直接返回
  if (targetWidth >= sourceWidth && targetHeight >= sourceHeight) {
    return imageData;
  }

  // 使用双三次插值
  if (useBicubic) {
    return bicubicResize(imageData, targetWidth, targetHeight);
  }

  // 回退到 Canvas 方法（双线性插值）
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('无法创建画布上下文');
  }
  
  // 使用高质量缩放（Canvas 默认使用双线性或 Lanczos）
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
 * 颜色优化：合并使用数量过少的颜色
 * 将低频颜色替换为最相似的高频颜色
 */
function optimizeColorUsage(
  result: ProcessResult,
  palette: PerlerColor[],
  minColorCount: number
): ProcessResult {
  const totalPixels = result.width * result.height;
  const minThreshold = minColorCount || Math.max(1, Math.ceil(totalPixels * 0.005)); // 至少0.5%或用户指定值

  // 找出低频和高频颜色
  const lowFreqColors: string[] = [];
  const highFreqColors: string[] = [];
  
  result.colorUsage.forEach((count, colorId) => {
    if (count < minThreshold) {
      lowFreqColors.push(colorId);
    } else {
      highFreqColors.push(colorId);
    }
  });

  // 如果没有低频颜色或没有高频颜色可替换，直接返回
  if (lowFreqColors.length === 0 || highFreqColors.length === 0) {
    return result;
  }

  // 构建替换映射表
  const replacementMap = new Map<string, string>();
  
  lowFreqColors.forEach(lowFreqColorId => {
    const lowFreqColor = palette.find(c => c.id === lowFreqColorId);
    if (!lowFreqColor) return;

    // 找到最相似的高频颜色
    let minDelta = Infinity;
    let bestMatch = highFreqColors[0];
    
    highFreqColors.forEach(highFreqColorId => {
      const highFreqColor = palette.find(c => c.id === highFreqColorId);
      if (!highFreqColor) return;

      const lab1 = rgbToLab(lowFreqColor.rgb);
      const lab2 = rgbToLab(highFreqColor.rgb);
      const delta = deltaE2000(lab1, lab2);

      if (delta < minDelta) {
        minDelta = delta;
        bestMatch = highFreqColorId;
      }
    });

    replacementMap.set(lowFreqColorId, bestMatch);
  });

  // 应用替换到像素数据
  const newPixels: PixelData[][] = result.pixels.map(row =>
    row.map(pixel => {
      const newColorId = replacementMap.get(pixel.color.id);
      if (newColorId) {
        const newColor = palette.find(c => c.id === newColorId);
        if (newColor) {
          return { ...pixel, color: newColor };
        }
      }
      return pixel;
    })
  );

  // 重新统计颜色使用
  const newColorUsage = new Map<string, number>();
  newPixels.forEach(row => {
    row.forEach(pixel => {
      const count = newColorUsage.get(pixel.color.id) || 0;
      newColorUsage.set(pixel.color.id, count + 1);
    });
  });

  return {
    pixels: newPixels,
    width: result.width,
    height: result.height,
    colorUsage: newColorUsage,
  };
}

/**
 * 限制颜色种类数量
 * 使用简化的颜色聚类策略
 */
function limitColorTypes(
  result: ProcessResult,
  palette: PerlerColor[],
  maxColorTypes: number
): ProcessResult {
  if (maxColorTypes <= 0 || result.colorUsage.size <= maxColorTypes) {
    return result;
  }

  // 按使用频率排序，保留最常用的颜色
  const sortedColors = Array.from(result.colorUsage.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColorTypes);

  const keepColorIds = new Set(sortedColors.map(([id]) => id));
  const keepColors = palette.filter(c => keepColorIds.has(c.id));

  // 将不保留的颜色替换为最相似的保留颜色
  const newPixels: PixelData[][] = result.pixels.map(row =>
    row.map(pixel => {
      if (!keepColorIds.has(pixel.color.id)) {
        const newColor = findClosestPerlerColor(pixel.color.rgb, keepColors);
        return { ...pixel, color: newColor };
      }
      return pixel;
    })
  );

  // 重新统计颜色使用
  const newColorUsage = new Map<string, number>();
  newPixels.forEach(row => {
    row.forEach(pixel => {
      const count = newColorUsage.get(pixel.color.id) || 0;
      newColorUsage.set(pixel.color.id, count + 1);
    });
  });

  return {
    pixels: newPixels,
    width: result.width,
    height: result.height,
    colorUsage: newColorUsage,
  };
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
  
  // 3. 降采样到目标尺寸（使用双三次插值）
  imageData = downsample(imageData, options.pixelSize, options.useBicubic !== false);
  
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
  
  let result: ProcessResult = {
    pixels,
    width,
    height,
    colorUsage,
  };

  // 6. 颜色优化：先限制颜色种类，再合并低频颜色
  if (options.maxColorTypes && options.maxColorTypes > 0) {
    result = limitColorTypes(result, options.colorPalette, options.maxColorTypes);
  }

  if (options.minColorCount && options.minColorCount > 0) {
    result = optimizeColorUsage(result, options.colorPalette, options.minColorCount);
  }
  
  return result;
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
