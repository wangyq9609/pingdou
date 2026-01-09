/**
 * 双三次插值（Bicubic Interpolation）实现
 * 用于高质量的图像缩放
 */

// 双三次插值的权重函数（Catmull-Rom 样条）
function cubicWeight(t: number, a: number = -0.5): number {
  const absT = Math.abs(t);
  if (absT <= 1) {
    return (a + 2) * absT * absT * absT - (a + 3) * absT * absT + 1;
  } else if (absT <= 2) {
    return a * absT * absT * absT - 5 * a * absT * absT + 8 * a * absT - 4 * a;
  }
  return 0;
}

/**
 * 获取像素值，处理边界
 */
function getPixel(data: Uint8ClampedArray, width: number, height: number, x: number, y: number, channel: number): number {
  // 边界处理：使用镜像边界
  x = Math.max(0, Math.min(width - 1, x));
  y = Math.max(0, Math.min(height - 1, y));
  const idx = (y * width + x) * 4 + channel;
  return data[idx];
}

/**
 * 在 x 方向进行三次插值
 */
function cubicInterpolateX(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  y: number,
  x: number,
  channel: number
): number {
  const x1 = Math.floor(x);
  const dx = x - x1;

  let sum = 0;
  for (let i = -1; i <= 2; i++) {
    const weight = cubicWeight(dx - i);
    sum += weight * getPixel(data, width, height, x1 + i, y, channel);
  }
  return sum;
}

/**
 * 双三次插值：在 y 方向再进行插值
 */
function bicubicInterpolate(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  channel: number
): number {
  const y1 = Math.floor(y);
  const dy = y - y1;

  let sum = 0;
  for (let j = -1; j <= 2; j++) {
    const weight = cubicWeight(dy - j);
    const interpolatedX = cubicInterpolateX(data, width, height, y1 + j, x, channel);
    sum += weight * interpolatedX;
  }
  return sum;
}

/**
 * 使用双三次插值进行图像缩放
 */
export function bicubicResize(
  sourceData: ImageData,
  targetWidth: number,
  targetHeight: number
): ImageData {
  const sourceWidth = sourceData.width;
  const sourceHeight = sourceData.height;
  const sourceDataArray = sourceData.data;

  const targetData = new Uint8ClampedArray(targetWidth * targetHeight * 4);
  
  const scaleX = sourceWidth / targetWidth;
  const scaleY = sourceHeight / targetHeight;

  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      // 计算源图像中的对应位置
      const srcX = (x + 0.5) * scaleX - 0.5;
      const srcY = (y + 0.5) * scaleY - 0.5;

      const idx = (y * targetWidth + x) * 4;

      // 对每个通道进行双三次插值
      targetData[idx] = Math.round(Math.max(0, Math.min(255, bicubicInterpolate(
        sourceDataArray,
        sourceWidth,
        sourceHeight,
        srcX,
        srcY,
        0 // R
      ))));
      
      targetData[idx + 1] = Math.round(Math.max(0, Math.min(255, bicubicInterpolate(
        sourceDataArray,
        sourceWidth,
        sourceHeight,
        srcX,
        srcY,
        1 // G
      ))));
      
      targetData[idx + 2] = Math.round(Math.max(0, Math.min(255, bicubicInterpolate(
        sourceDataArray,
        sourceWidth,
        sourceHeight,
        srcX,
        srcY,
        2 // B
      ))));
      
      targetData[idx + 3] = 255; // Alpha
    }
  }

  return new ImageData(targetData, targetWidth, targetHeight);
}
