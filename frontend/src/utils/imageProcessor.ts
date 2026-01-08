import { BeadColor, GridCell } from '../types';
import { RGB, LAB, rgbToLab, deltaE2000 } from './colorConverter';

// 图像预处理选项
export interface ImageProcessOptions {
  contrast?: number;      // 对比度 0.5-2.0，默认 1.0
  brightness?: number;    // 亮度 0.5-2.0，默认 1.0
  saturation?: number;    // 饱和度 0.5-2.0，默认 1.0
  sharpen?: boolean;      // 是否锐化，默认 false
  sharpenAmount?: number; // 锐化强度 0-1，默认 0.5
  preserveColors?: boolean; // 精确颜色模式：禁用所有预处理以保持颜色准确，默认 false
}

// 调整图片尺寸
export async function resizeImage(
  image: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  preserveColors: boolean = false
): Promise<ImageData> {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d', { 
    colorSpace: 'srgb',  // 明确使用 sRGB 色彩空间
    willReadFrequently: true 
  });
  if (!ctx) {
    throw new Error('无法获取 Canvas 上下文');
  }

  if (preserveColors) {
    // 精确颜色模式：使用最近邻插值（无平滑）
    ctx.imageSmoothingEnabled = false;
  } else {
    // 使用高质量缩放
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  return ctx.getImageData(0, 0, targetWidth, targetHeight);
}

// 图像预处理
export function preprocessImage(
  imageData: ImageData,
  options: ImageProcessOptions = {}
): ImageData {
  const {
    contrast = 1.0,
    brightness = 1.0,
    saturation = 1.0,
    sharpen = false,
    sharpenAmount = 0.5,
    preserveColors = false,
  } = options;

  // 精确颜色模式：跳过所有预处理
  if (preserveColors) {
    return imageData;
  }

  const width = imageData.width;
  const height = imageData.height;
  const data = new Uint8ClampedArray(imageData.data);

  // 应用对比度、亮度、饱和度
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 亮度调整
    r *= brightness;
    g *= brightness;
    b *= brightness;

    // 对比度调整
    r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
    g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
    b = ((b / 255 - 0.5) * contrast + 0.5) * 255;

    // 饱和度调整
    if (saturation !== 1.0) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * saturation;
      g = gray + (g - gray) * saturation;
      b = gray + (b - gray) * saturation;
    }

    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }

  // 锐化处理
  if (sharpen) {
    return sharpenImage(
      new ImageData(data, width, height),
      sharpenAmount
    );
  }

  return new ImageData(data, width, height);
}

// 锐化滤镜
function sharpenImage(imageData: ImageData, amount: number): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const output = new Uint8ClampedArray(data.length);

  // 锐化卷积核
  const weight = amount;
  const kernel = [
    0, -weight, 0,
    -weight, 1 + 4 * weight, -weight,
    0, -weight, 0
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;

      // 应用卷积核
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const px = Math.min(Math.max(x + kx, 0), width - 1);
          const py = Math.min(Math.max(y + ky, 0), height - 1);
          const idx = (py * width + px) * 4;
          const kIdx = (ky + 1) * 3 + (kx + 1);

          r += data[idx] * kernel[kIdx];
          g += data[idx + 1] * kernel[kIdx];
          b += data[idx + 2] * kernel[kIdx];
        }
      }

      const idx = (y * width + x) * 4;
      output[idx] = clamp(r);
      output[idx + 1] = clamp(g);
      output[idx + 2] = clamp(b);
      output[idx + 3] = data[idx + 3];
    }
  }

  return new ImageData(output, width, height);
}

// 颜色匹配缓存
const colorMatchCache = new Map<string, BeadColor>();
const paletteLABCache = new WeakMap<BeadColor[], Map<string, LAB>>();

// 清除缓存
export function clearColorMatchCache() {
  colorMatchCache.clear();
}

// 获取色板的LAB缓存
function getPaletteLABCache(palette: BeadColor[]): Map<string, LAB> {
  let cache = paletteLABCache.get(palette);
  if (!cache) {
    cache = new Map();
    for (const beadColor of palette) {
      cache.set(beadColor.id, rgbToLab(beadColor.rgb));
    }
    paletteLABCache.set(palette, cache);
  }
  return cache;
}

// 颜色匹配选项
export interface ColorMatchOptions {
  weightLightness?: number;  // 亮度权重 (默认 1.0)
  weightChroma?: number;     // 色度权重 (默认 1.0)
  weightHue?: number;        // 色相权重 (默认 1.0)
}

// 匹配到最接近的拼豆颜色（带缓存和可配置权重）
export function matchToBeadColor(
  rgb: RGB, 
  palette: BeadColor[], 
  options: ColorMatchOptions = {}
): BeadColor {
  const { weightLightness = 1.0, weightChroma = 1.0, weightHue = 1.0 } = options;
  
  // 生成缓存key（包含权重）
  const cacheKey = `${rgb.r},${rgb.g},${rgb.b}|${palette.map(p => p.id).join(',')}|${weightLightness},${weightChroma},${weightHue}`;
  
  // 检查缓存
  const cached = colorMatchCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // 获取色板LAB缓存
  const labCache = getPaletteLABCache(palette);
  const targetLab = rgbToLab(rgb);
  
  let minDistance = Infinity;
  let closestColor = palette[0];

  for (const beadColor of palette) {
    const beadLab = labCache.get(beadColor.id)!;
    
    // 使用可配置的权重计算距离
    let distance: number;
    if (weightLightness === 1.0 && weightChroma === 1.0 && weightHue === 1.0) {
      // 使用标准 deltaE2000
      distance = deltaE2000(targetLab, beadLab);
    } else {
      // 使用加权距离
      distance = deltaE2000Weighted(targetLab, beadLab, weightLightness, weightChroma, weightHue);
    }

    if (distance < minDistance) {
      minDistance = distance;
      closestColor = beadColor;
    }
  }

  // 缓存结果（限制缓存大小）
  if (colorMatchCache.size > 10000) {
    // 清除最早的一半缓存
    const keysToDelete = Array.from(colorMatchCache.keys()).slice(0, 5000);
    keysToDelete.forEach(key => colorMatchCache.delete(key));
  }
  colorMatchCache.set(cacheKey, closestColor);

  return closestColor;
}

// 加权的 deltaE2000（允许调整亮度、色度、色相的重要性）
function deltaE2000Weighted(
  lab1: LAB, 
  lab2: LAB,
  kL: number = 1.0,
  kC: number = 1.0,
  kH: number = 1.0
): number {
  const L1 = lab1.l;
  const a1 = lab1.a;
  const b1 = lab1.b;
  const L2 = lab2.l;
  const a2 = lab2.a;
  const b2 = lab2.b;

  // 计算 C1, C2 (色度)
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);

  // 计算平均色度
  const avgC = (C1 + C2) / 2;

  // 计算 G 因子
  const G = 0.5 * (1 - Math.sqrt(Math.pow(avgC, 7) / (Math.pow(avgC, 7) + Math.pow(25, 7))));

  // 调整 a 值
  const a1Prime = a1 * (1 + G);
  const a2Prime = a2 * (1 + G);

  // 重新计算色度
  const C1Prime = Math.sqrt(a1Prime * a1Prime + b1 * b1);
  const C2Prime = Math.sqrt(a2Prime * a2Prime + b2 * b2);

  // 计算色调角
  const h1Prime = (Math.atan2(b1, a1Prime) * 180 / Math.PI + 360) % 360;
  const h2Prime = (Math.atan2(b2, a2Prime) * 180 / Math.PI + 360) % 360;

  // 计算差值
  const deltaLPrime = L2 - L1;
  const deltaCPrime = C2Prime - C1Prime;

  // 计算色调差
  let deltahPrime;
  if (C1Prime * C2Prime === 0) {
    deltahPrime = 0;
  } else if (Math.abs(h2Prime - h1Prime) <= 180) {
    deltahPrime = h2Prime - h1Prime;
  } else if (h2Prime - h1Prime > 180) {
    deltahPrime = h2Prime - h1Prime - 360;
  } else {
    deltahPrime = h2Prime - h1Prime + 360;
  }

  const deltaHPrime = 2 * Math.sqrt(C1Prime * C2Prime) * Math.sin((deltahPrime * Math.PI / 180) / 2);

  // 计算平均值
  const avgLPrime = (L1 + L2) / 2;
  const avgCPrime = (C1Prime + C2Prime) / 2;

  let avghPrime;
  if (C1Prime * C2Prime === 0) {
    avghPrime = h1Prime + h2Prime;
  } else if (Math.abs(h1Prime - h2Prime) <= 180) {
    avghPrime = (h1Prime + h2Prime) / 2;
  } else if (h1Prime + h2Prime < 360) {
    avghPrime = (h1Prime + h2Prime + 360) / 2;
  } else {
    avghPrime = (h1Prime + h2Prime - 360) / 2;
  }

  // 计算 T
  const T = 1 - 0.17 * Math.cos((avghPrime - 30) * Math.PI / 180) +
            0.24 * Math.cos(2 * avghPrime * Math.PI / 180) +
            0.32 * Math.cos((3 * avghPrime + 6) * Math.PI / 180) -
            0.20 * Math.cos((4 * avghPrime - 63) * Math.PI / 180);

  // 计算 SL, SC, SH
  const SL = 1 + (0.015 * Math.pow(avgLPrime - 50, 2)) / 
             Math.sqrt(20 + Math.pow(avgLPrime - 50, 2));
  const SC = 1 + 0.045 * avgCPrime;
  const SH = 1 + 0.015 * avgCPrime * T;

  // 计算旋转项 RT
  const deltaTheta = 30 * Math.exp(-Math.pow((avghPrime - 275) / 25, 2));
  const RC = 2 * Math.sqrt(Math.pow(avgCPrime, 7) / (Math.pow(avgCPrime, 7) + Math.pow(25, 7)));
  const RT = -RC * Math.sin(2 * deltaTheta * Math.PI / 180);

  // 最终加权 CIEDE2000 色差
  const deltaE = Math.sqrt(
    Math.pow(deltaLPrime / (kL * SL), 2) +
    Math.pow(deltaCPrime / (kC * SC), 2) +
    Math.pow(deltaHPrime / (kH * SH), 2) +
    RT * (deltaCPrime / (kC * SC)) * (deltaHPrime / (kH * SH))
  );

  return deltaE;
}

// 增强的颜色量化算法
export function quantizeColors(
  imageData: ImageData,
  palette: BeadColor[],
  maxColors: number = 16
): BeadColor[] {
  const pixels: RGB[] = [];
  const data = imageData.data;

  // 收集所有非透明像素
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 128) continue;
    
    pixels.push({
      r: data[i],
      g: data[i + 1],
      b: data[i + 2],
    });
  }

  if (pixels.length === 0) {
    return palette.slice(0, maxColors);
  }

  // 计算图像的颜色范围和分布
  const colorStats = analyzeColorDistribution(pixels);
  
  // 使用 K-means 聚类，增加簇数以获得更好的覆盖
  const clusterCount = Math.min(maxColors * 3, pixels.length, 48);
  const clusters = kMeansClustering(pixels, clusterCount, 15);

  // 为每个聚类找到最佳拼豆颜色
  const colorScores = new Map<string, number>();

  for (const cluster of clusters) {
    const beadColor = matchToBeadColor(cluster.center, palette);
    const colorLab = rgbToLab(beadColor.rgb);
    const clusterLab = rgbToLab(cluster.center);
    
    // 计算质量分数：考虑聚类大小和颜色匹配度
    const distance = deltaE2000(colorLab, clusterLab);
    const size = cluster.size;
    const score = size * Math.exp(-distance / 10);
    
    colorScores.set(beadColor.id, (colorScores.get(beadColor.id) || 0) + score);
  }

  // 选择得分最高的颜色
  let selectedColors = Array.from(colorScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors)
    .map(([id]) => palette.find(c => c.id === id)!)
    .filter(Boolean);

  // 确保包含关键颜色（最亮和最暗）
  selectedColors = ensureKeyColors(selectedColors, palette, colorStats);

  // 如果颜色不足，从色板中补充
  if (selectedColors.length < Math.min(4, maxColors)) {
    const used = new Set(selectedColors.map(c => c.id));
    for (const color of palette) {
      if (!used.has(color.id) && selectedColors.length < maxColors) {
        selectedColors.push(color);
        used.add(color.id);
      }
    }
  }

  return selectedColors;
}

// 分析颜色分布
interface ColorStats {
  minLightness: number;
  maxLightness: number;
  avgLightness: number;
  hasHighContrast: boolean;
}

function analyzeColorDistribution(pixels: RGB[]): ColorStats {
  const lightnesses = pixels.map(p => {
    const lab = rgbToLab(p);
    return lab.l;
  });

  const minL = Math.min(...lightnesses);
  const maxL = Math.max(...lightnesses);
  const avgL = lightnesses.reduce((sum, l) => sum + l, 0) / lightnesses.length;

  return {
    minLightness: minL,
    maxLightness: maxL,
    avgLightness: avgL,
    hasHighContrast: (maxL - minL) > 50,
  };
}

// 确保包含关键颜色
function ensureKeyColors(
  selectedColors: BeadColor[],
  palette: BeadColor[],
  stats: ColorStats
): BeadColor[] {
  const result = [...selectedColors];
  const selectedIds = new Set(result.map(c => c.id));

  // 如果图像有高对比度，确保有最暗和最亮的颜色
  if (stats.hasHighContrast) {
    // 找到最暗的可用颜色
    const darkestAvailable = palette
      .filter(c => !selectedIds.has(c.id))
      .sort((a, b) => rgbToLab(a.rgb).l - rgbToLab(b.rgb).l)[0];
    
    // 找到最亮的可用颜色  
    const lightestAvailable = palette
      .filter(c => !selectedIds.has(c.id))
      .sort((a, b) => rgbToLab(b.rgb).l - rgbToLab(a.rgb).l)[0];

    // 检查是否已经有足够亮/暗的颜色
    const hasVeryDark = result.some(c => rgbToLab(c.rgb).l < 30);
    const hasVeryLight = result.some(c => rgbToLab(c.rgb).l > 80);

    if (!hasVeryDark && darkestAvailable && stats.minLightness < 40) {
      // 替换使用最少的颜色
      if (result.length >= selectedColors.length) {
        result.pop();
      }
      result.push(darkestAvailable);
      selectedIds.add(darkestAvailable.id);
    }

    if (!hasVeryLight && lightestAvailable && stats.maxLightness > 70) {
      if (result.length >= selectedColors.length) {
        result.pop();
      }
      result.push(lightestAvailable);
      selectedIds.add(lightestAvailable.id);
    }
  }

  return result;
}

// K-means 聚类算法
interface Cluster {
  center: RGB;
  size: number;
}

function kMeansClustering(pixels: RGB[], k: number, maxIterations: number = 10): Cluster[] {
  if (pixels.length === 0) return [];
  if (k >= pixels.length) {
    return pixels.map(p => ({ center: p, size: 1 }));
  }

  // 初始化聚类中心（使用 K-means++ 算法）
  const centers: RGB[] = [];
  centers.push(pixels[Math.floor(Math.random() * pixels.length)]);

  while (centers.length < k) {
    const distances = pixels.map(pixel => {
      const minDist = Math.min(...centers.map(center => colorDistance(pixel, center)));
      return minDist * minDist;
    });

    const totalDist = distances.reduce((sum, d) => sum + d, 0);
    let random = Math.random() * totalDist;

    for (let i = 0; i < pixels.length; i++) {
      random -= distances[i];
      if (random <= 0) {
        centers.push(pixels[i]);
        break;
      }
    }
  }

  // 迭代优化
  let assignments = new Array(pixels.length).fill(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;

    // 分配像素到最近的聚类中心
    for (let i = 0; i < pixels.length; i++) {
      let minDist = Infinity;
      let bestCluster = 0;

      for (let j = 0; j < centers.length; j++) {
        const dist = colorDistance(pixels[i], centers[j]);
        if (dist < minDist) {
          minDist = dist;
          bestCluster = j;
        }
      }

      if (assignments[i] !== bestCluster) {
        assignments[i] = bestCluster;
        changed = true;
      }
    }

    if (!changed) break;

    // 更新聚类中心
    for (let j = 0; j < k; j++) {
      const clusterPixels = pixels.filter((_, i) => assignments[i] === j);
      
      if (clusterPixels.length > 0) {
        const sumR = clusterPixels.reduce((sum, p) => sum + p.r, 0);
        const sumG = clusterPixels.reduce((sum, p) => sum + p.g, 0);
        const sumB = clusterPixels.reduce((sum, p) => sum + p.b, 0);
        
        centers[j] = {
          r: Math.round(sumR / clusterPixels.length),
          g: Math.round(sumG / clusterPixels.length),
          b: Math.round(sumB / clusterPixels.length),
        };
      }
    }
  }

  // 构建结果
  const clusters: Cluster[] = [];
  for (let j = 0; j < k; j++) {
    const size = assignments.filter(a => a === j).length;
    if (size > 0) {
      clusters.push({
        center: centers[j],
        size,
      });
    }
  }

  return clusters;
}

// 计算两个颜色之间的距离（在 LAB 空间）
function colorDistance(c1: RGB, c2: RGB): number {
  const lab1 = rgbToLab(c1);
  const lab2 = rgbToLab(c2);
  return deltaE2000(lab1, lab2);
}

// 抖动算法类型
export type DitheringMethod = 'none' | 'floyd-steinberg' | 'atkinson' | 'jarvis' | 'stucki';

// 进度回调类型
export interface ProcessProgress {
  stage: 'resize' | 'preprocess' | 'quantize' | 'dither' | 'complete';
  progress: number; // 0-100
  message: string;
}

export type ProgressCallback = (progress: ProcessProgress) => void;

// 取消令牌
export class CancellationToken {
  private _cancelled = false;
  
  cancel() {
    this._cancelled = true;
  }
  
  get isCancelled(): boolean {
    return this._cancelled;
  }
  
  throwIfCancelled() {
    if (this._cancelled) {
      throw new Error('操作已取消');
    }
  }
}

// 将图片转换为网格（支持多种抖动算法）
export function imageToGrid(
  imageData: ImageData,
  palette: BeadColor[],
  width: number,
  height: number,
  ditheringMethod: DitheringMethod = 'none',
  onProgress?: ProgressCallback,
  cancellationToken?: CancellationToken
): GridCell[][] {
  switch (ditheringMethod) {
    case 'floyd-steinberg':
      return imageToGridWithFloydSteinberg(imageData, palette, width, height, onProgress, cancellationToken);
    case 'atkinson':
      return imageToGridWithAtkinson(imageData, palette, width, height, onProgress, cancellationToken);
    case 'jarvis':
      return imageToGridWithJarvis(imageData, palette, width, height, onProgress, cancellationToken);
    case 'stucki':
      return imageToGridWithStucki(imageData, palette, width, height, onProgress, cancellationToken);
    default:
      return imageToGridNoDithering(imageData, palette, width, height, onProgress, cancellationToken);
  }
}

// 不使用抖动
function imageToGridNoDithering(
  imageData: ImageData,
  palette: BeadColor[],
  width: number,
  height: number,
  onProgress?: ProgressCallback,
  cancellationToken?: CancellationToken
): GridCell[][] {
  const grid: GridCell[][] = [];
  const data = imageData.data;

  for (let y = 0; y < height; y++) {
    cancellationToken?.throwIfCancelled();
    
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

    // 报告进度（每10行）
    if (onProgress && y % 10 === 0) {
      const progress = Math.floor((y / height) * 100);
      onProgress({
        stage: 'dither',
        progress,
        message: `正在生成网格: ${progress}%`,
      });
    }
  }

  return grid;
}

// Floyd-Steinberg 抖动算法
function imageToGridWithFloydSteinberg(
  imageData: ImageData,
  palette: BeadColor[],
  width: number,
  height: number,
  onProgress?: ProgressCallback,
  cancellationToken?: CancellationToken
): GridCell[][] {
  return applyErrorDiffusion(imageData, palette, width, height, [
    { dx: 1, dy: 0, weight: 7/16 },
    { dx: -1, dy: 1, weight: 3/16 },
    { dx: 0, dy: 1, weight: 5/16 },
    { dx: 1, dy: 1, weight: 1/16 },
  ], true, onProgress, cancellationToken);
}

// Atkinson 抖动算法（更柔和）
function imageToGridWithAtkinson(
  imageData: ImageData,
  palette: BeadColor[],
  width: number,
  height: number,
  onProgress?: ProgressCallback,
  cancellationToken?: CancellationToken
): GridCell[][] {
  return applyErrorDiffusion(imageData, palette, width, height, [
    { dx: 1, dy: 0, weight: 1/8 },
    { dx: 2, dy: 0, weight: 1/8 },
    { dx: -1, dy: 1, weight: 1/8 },
    { dx: 0, dy: 1, weight: 1/8 },
    { dx: 1, dy: 1, weight: 1/8 },
    { dx: 0, dy: 2, weight: 1/8 },
  ], true, onProgress, cancellationToken);
}

// Jarvis-Judice-Ninke 抖动算法
function imageToGridWithJarvis(
  imageData: ImageData,
  palette: BeadColor[],
  width: number,
  height: number,
  onProgress?: ProgressCallback,
  cancellationToken?: CancellationToken
): GridCell[][] {
  return applyErrorDiffusion(imageData, palette, width, height, [
    { dx: 1, dy: 0, weight: 7/48 },
    { dx: 2, dy: 0, weight: 5/48 },
    { dx: -2, dy: 1, weight: 3/48 },
    { dx: -1, dy: 1, weight: 5/48 },
    { dx: 0, dy: 1, weight: 7/48 },
    { dx: 1, dy: 1, weight: 5/48 },
    { dx: 2, dy: 1, weight: 3/48 },
    { dx: -2, dy: 2, weight: 1/48 },
    { dx: -1, dy: 2, weight: 3/48 },
    { dx: 0, dy: 2, weight: 5/48 },
    { dx: 1, dy: 2, weight: 3/48 },
    { dx: 2, dy: 2, weight: 1/48 },
  ], true, onProgress, cancellationToken);
}

// Stucki 抖动算法
function imageToGridWithStucki(
  imageData: ImageData,
  palette: BeadColor[],
  width: number,
  height: number,
  onProgress?: ProgressCallback,
  cancellationToken?: CancellationToken
): GridCell[][] {
  return applyErrorDiffusion(imageData, palette, width, height, [
    { dx: 1, dy: 0, weight: 8/42 },
    { dx: 2, dy: 0, weight: 4/42 },
    { dx: -2, dy: 1, weight: 2/42 },
    { dx: -1, dy: 1, weight: 4/42 },
    { dx: 0, dy: 1, weight: 8/42 },
    { dx: 1, dy: 1, weight: 4/42 },
    { dx: 2, dy: 1, weight: 2/42 },
    { dx: -2, dy: 2, weight: 1/42 },
    { dx: -1, dy: 2, weight: 2/42 },
    { dx: 0, dy: 2, weight: 4/42 },
    { dx: 1, dy: 2, weight: 2/42 },
    { dx: 2, dy: 2, weight: 1/42 },
  ], true, onProgress, cancellationToken);
}

// 通用误差扩散算法
interface ErrorDiffusionKernel {
  dx: number;
  dy: number;
  weight: number;
}

function applyErrorDiffusion(
  imageData: ImageData,
  palette: BeadColor[],
  width: number,
  height: number,
  kernel: ErrorDiffusionKernel[],
  useSerpentine: boolean = true,
  onProgress?: ProgressCallback,
  cancellationToken?: CancellationToken
): GridCell[][] {
  const grid: GridCell[][] = [];
  const data = new Uint8ClampedArray(imageData.data);

  for (let y = 0; y < height; y++) {
    // 检查是否取消
    cancellationToken?.throwIfCancelled();
    
    const row: GridCell[] = new Array(width);
    
    // Serpentine 扫描：奇数行从左到右，偶数行从右到左
    const isRightToLeft = useSerpentine && y % 2 === 1;
    const xStart = isRightToLeft ? width - 1 : 0;
    const xEnd = isRightToLeft ? -1 : width;
    const xStep = isRightToLeft ? -1 : 1;
    
    for (let x = xStart; x !== xEnd; x += xStep) {
      const index = (y * width + x) * 4;
      
      const oldRgb: RGB = {
        r: data[index],
        g: data[index + 1],
        b: data[index + 2],
      };

      const beadColor = matchToBeadColor(oldRgb, palette);
      
      row[x] = {
        x,
        y,
        colorId: beadColor.id,
        color: beadColor,
      };

      const errorR = oldRgb.r - beadColor.rgb.r;
      const errorG = oldRgb.g - beadColor.rgb.g;
      const errorB = oldRgb.b - beadColor.rgb.b;

      // 扩散误差（根据扫描方向调整）
      for (const { dx, dy, weight } of kernel) {
        // 如果是从右到左扫描，水平方向反转
        const adjustedDx = isRightToLeft ? -dx : dx;
        const nx = x + adjustedDx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nIndex = (ny * width + nx) * 4;
          data[nIndex] = clamp(data[nIndex] + errorR * weight);
          data[nIndex + 1] = clamp(data[nIndex + 1] + errorG * weight);
          data[nIndex + 2] = clamp(data[nIndex + 2] + errorB * weight);
        }
      }
    }
    
    grid.push(row);

    // 报告进度（每5行）
    if (onProgress && y % 5 === 0) {
      const progress = Math.floor((y / height) * 100);
      onProgress({
        stage: 'dither',
        progress,
        message: `正在应用抖动算法: ${progress}%`,
      });
    }
  }

  return grid;
}

// 保持向后兼容
export function imageToGridWithDithering(
  imageData: ImageData,
  palette: BeadColor[],
  width: number,
  height: number
): GridCell[][] {
  return imageToGridWithFloydSteinberg(imageData, palette, width, height);
}

// 辅助函数：将值限制在 0-255 范围内
function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

// 生成颜色对比预览（左侧原图，右侧拼豆效果）
export function createColorComparisonPreview(
  originalImage: ImageData,
  grid: GridCell[][]
): ImageData {
  const width = originalImage.width;
  const height = originalImage.height;
  
  // 创建并排的对比图 (原图 | 拼豆图)
  const comparisonCanvas = document.createElement('canvas');
  comparisonCanvas.width = width * 2;
  comparisonCanvas.height = height;
  
  const ctx = comparisonCanvas.getContext('2d', { colorSpace: 'srgb' });
  if (!ctx) {
    throw new Error('无法获取 Canvas 上下文');
  }
  
  // 绘制原图（左侧）
  ctx.putImageData(originalImage, 0, 0);
  
  // 绘制拼豆效果（右侧）
  const beadImageData = new ImageData(width, height);
  const beadData = beadImageData.data;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = grid[y][x];
      const idx = (y * width + x) * 4;
      
      beadData[idx] = cell.color.rgb.r;
      beadData[idx + 1] = cell.color.rgb.g;
      beadData[idx + 2] = cell.color.rgb.b;
      beadData[idx + 3] = 255;
    }
  }
  
  ctx.putImageData(beadImageData, width, 0);
  
  return ctx.getImageData(0, 0, width * 2, height);
}

// 计算颜色匹配质量报告
export interface ColorMatchQuality {
  averageDeltaE: number;      // 平均色差
  maxDeltaE: number;           // 最大色差
  minDeltaE: number;           // 最小色差
  excellentMatches: number;    // 优秀匹配 (ΔE < 2)
  goodMatches: number;         // 良好匹配 (ΔE < 5)
  fairMatches: number;         // 一般匹配 (ΔE < 10)
  poorMatches: number;         // 较差匹配 (ΔE >= 10)
  totalPixels: number;         // 总像素数
}

export function analyzeColorMatchQuality(
  originalImage: ImageData,
  grid: GridCell[][]
): ColorMatchQuality {
  const width = originalImage.width;
  const height = originalImage.height;
  const data = originalImage.data;
  
  let totalDeltaE = 0;
  let maxDeltaE = 0;
  let minDeltaE = Infinity;
  let excellentMatches = 0;
  let goodMatches = 0;
  let fairMatches = 0;
  let poorMatches = 0;
  let totalPixels = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const originalRgb: RGB = {
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2],
      };
      
      const cell = grid[y][x];
      const beadRgb = cell.color.rgb;
      
      const originalLab = rgbToLab(originalRgb);
      const beadLab = rgbToLab(beadRgb);
      const deltaE = deltaE2000(originalLab, beadLab);
      
      totalDeltaE += deltaE;
      maxDeltaE = Math.max(maxDeltaE, deltaE);
      minDeltaE = Math.min(minDeltaE, deltaE);
      
      if (deltaE < 2) excellentMatches++;
      else if (deltaE < 5) goodMatches++;
      else if (deltaE < 10) fairMatches++;
      else poorMatches++;
      
      totalPixels++;
    }
  }
  
  return {
    averageDeltaE: totalDeltaE / totalPixels,
    maxDeltaE,
    minDeltaE,
    excellentMatches,
    goodMatches,
    fairMatches,
    poorMatches,
    totalPixels,
  };
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

// 智能参数推荐
export interface RecommendedParams {
  gridSize: { width: number; height: number };
  colorCount: number;
  contrast: number;
  brightness: number;
  saturation: number;
  sharpen: boolean;
  ditheringMethod: DitheringMethod;
  reason: string;
}

// 快速预览配置
export interface QuickPreviewOptions {
  enabled: boolean;
  maxSize: number; // 预览最大尺寸
}

// 生成快速预览
export async function generateQuickPreview(
  image: HTMLImageElement,
  palette: BeadColor[],
  options: ImageProcessOptions & { ditheringMethod: DitheringMethod },
  maxSize: number = 15
): Promise<GridCell[][]> {
  // 计算预览尺寸（保持宽高比）
  const aspectRatio = image.width / image.height;
  let previewWidth = maxSize;
  let previewHeight = maxSize;
  
  if (aspectRatio > 1) {
    previewHeight = Math.round(maxSize / aspectRatio);
  } else {
    previewWidth = Math.round(maxSize * aspectRatio);
  }

  // 快速处理
  let imageData = await resizeImage(image, previewWidth, previewHeight);
  imageData = preprocessImage(imageData, options);
  
  const usedColors = quantizeColors(imageData, palette, Math.min(8, palette.length));
  
  return imageToGrid(
    imageData,
    usedColors,
    previewWidth,
    previewHeight,
    options.ditheringMethod || 'floyd-steinberg'
  );
}

export async function analyzeImageAndRecommend(
  image: HTMLImageElement
): Promise<RecommendedParams> {
  // 创建小画布分析图像
  const canvas = document.createElement('canvas');
  const analysisSize = 100;
  canvas.width = analysisSize;
  canvas.height = analysisSize;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法获取 Canvas 上下文');
  }
  
  ctx.drawImage(image, 0, 0, analysisSize, analysisSize);
  const imageData = ctx.getImageData(0, 0, analysisSize, analysisSize);
  const data = imageData.data;
  
  // 分析图像特征
  let totalR = 0, totalG = 0, totalB = 0;
  let totalBrightness = 0;
  let colorVariance = 0;
  let edgeCount = 0;
  const colorSet = new Set<string>();
  
  // 计算平均值和颜色多样性
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    totalR += r;
    totalG += g;
    totalB += b;
    
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    totalBrightness += brightness;
    
    // 颜色量化到32级以统计多样性
    const colorKey = `${Math.floor(r/32)},${Math.floor(g/32)},${Math.floor(b/32)}`;
    colorSet.add(colorKey);
  }
  
  const pixelCount = data.length / 4;
  const avgR = totalR / pixelCount;
  const avgG = totalG / pixelCount;
  const avgB = totalB / pixelCount;
  const avgBrightness = totalBrightness / pixelCount;
  
  // 计算颜色方差（复杂度）
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    colorVariance += Math.pow(r - avgR, 2) + Math.pow(g - avgG, 2) + Math.pow(b - avgB, 2);
  }
  colorVariance = Math.sqrt(colorVariance / pixelCount);
  
  // 简单边缘检测（Sobel）
  for (let y = 1; y < analysisSize - 1; y++) {
    for (let x = 1; x < analysisSize - 1; x++) {
      const idx = (y * analysisSize + x) * 4;
      const brightness = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      
      // 检查周围像素
      const idxLeft = (y * analysisSize + (x - 1)) * 4;
      const idxRight = (y * analysisSize + (x + 1)) * 4;
      const brightnessLeft = 0.299 * data[idxLeft] + 0.587 * data[idxLeft + 1] + 0.114 * data[idxLeft + 2];
      const brightnessRight = 0.299 * data[idxRight] + 0.587 * data[idxRight + 1] + 0.114 * data[idxRight + 2];
      
      if (Math.abs(brightness - brightnessLeft) > 30 || Math.abs(brightness - brightnessRight) > 30) {
        edgeCount++;
      }
    }
  }
  
  const edgeDensity = edgeCount / (analysisSize * analysisSize);
  const colorDiversity = colorSet.size;
  const aspectRatio = image.width / image.height;
  
  // 判断图像类型并推荐参数
  let reason = '';
  let params: RecommendedParams;
  
  // 判断是否为像素艺术（低分辨率、少颜色、硬边缘）
  if (colorDiversity < 50 && edgeDensity > 0.15 && image.width * image.height < 10000) {
    params = {
      gridSize: { width: 25, height: 25 },
      colorCount: 8,
      contrast: 1.5,
      brightness: 1.0,
      saturation: 1.2,
      sharpen: false,
      ditheringMethod: 'none',
      reason: '检测到像素艺术风格',
    };
    reason = '图像具有少量颜色和清晰边缘，适合像素艺术处理';
  }
  // 判断是否为卡通/动漫（高饱和度、清晰边缘、中等颜色）
  else if (edgeDensity > 0.2 && colorVariance > 70) {
    params = {
      gridSize: { width: Math.round(40 * Math.sqrt(aspectRatio)), height: Math.round(40 / Math.sqrt(aspectRatio)) },
      colorCount: 12,
      contrast: 1.4,
      brightness: 1.0,
      saturation: 1.3,
      sharpen: true,
      ditheringMethod: 'floyd-steinberg',
      reason: '检测到卡通/动漫风格',
    };
    reason = '图像有清晰线条和鲜艳色彩，适合卡通处理';
  }
  // 判断是否为人像（中心区域亮度较高，颜色变化平缓）
  else if (avgBrightness > 120 && colorVariance < 60 && aspectRatio > 0.7 && aspectRatio < 1.3) {
    params = {
      gridSize: { width: 40, height: 50 },
      colorCount: 16,
      contrast: 1.3,
      brightness: 1.1,
      saturation: 1.0,
      sharpen: true,
      ditheringMethod: 'atkinson',
      reason: '检测到人像照片',
    };
    reason = '图像似乎包含人像，使用柔和抖动保持肤色自然';
  }
  // 判断是否为风景（横向、高颜色多样性）
  else if (aspectRatio > 1.2 && colorDiversity > 150) {
    params = {
      gridSize: { width: 50, height: 40 },
      colorCount: 20,
      contrast: 1.2,
      brightness: 1.0,
      saturation: 1.2,
      sharpen: true,
      ditheringMethod: 'floyd-steinberg',
      reason: '检测到风景照片',
    };
    reason = '图像色彩丰富且横向布局，适合风景处理';
  }
  // 暗色图片
  else if (avgBrightness < 80) {
    params = {
      gridSize: { width: 35, height: 35 },
      colorCount: 14,
      contrast: 1.5,
      brightness: 1.2,
      saturation: 1.1,
      sharpen: true,
      ditheringMethod: 'floyd-steinberg',
      reason: '检测到暗色图片',
    };
    reason = '图像较暗，提高亮度和对比度以改善可见度';
  }
  // 默认通用推荐
  else {
    params = {
      gridSize: { width: 35, height: 35 },
      colorCount: 14,
      contrast: 1.3,
      brightness: 1.0,
      saturation: 1.1,
      sharpen: true,
      ditheringMethod: 'floyd-steinberg',
      reason: '通用优化参数',
    };
    reason = '使用经过优化的通用参数，适合大多数图片';
  }
  
  return { ...params, reason: reason };
}
