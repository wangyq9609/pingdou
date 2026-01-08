// RGB 颜色接口
export interface RGB {
  r: number;
  g: number;
  b: number;
}

// LAB 颜色接口
export interface LAB {
  l: number;
  a: number;
  b: number;
}

// RGB 转 XYZ
function rgbToXyz(rgb: RGB): { x: number; y: number; z: number } {
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  // Gamma 校正
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  // 转换到 XYZ (使用 D65 白点)
  const x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047;
  const y = (r * 0.2126729 + g * 0.7151522 + b * 0.0721750) / 1.00000;
  const z = (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) / 1.08883;

  return { x, y, z };
}

// XYZ 转 LAB
function xyzToLab(xyz: { x: number; y: number; z: number }): LAB {
  const epsilon = 0.008856;
  const kappa = 903.3;

  const fx = xyz.x > epsilon ? Math.pow(xyz.x, 1 / 3) : (kappa * xyz.x + 16) / 116;
  const fy = xyz.y > epsilon ? Math.pow(xyz.y, 1 / 3) : (kappa * xyz.y + 16) / 116;
  const fz = xyz.z > epsilon ? Math.pow(xyz.z, 1 / 3) : (kappa * xyz.z + 16) / 116;

  const l = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return { l, a, b };
}

// RGB 转 LAB (组合函数)
export function rgbToLab(rgb: RGB): LAB {
  const xyz = rgbToXyz(rgb);
  return xyzToLab(xyz);
}

// CIEDE2000 色差计算（完整实现）
export function deltaE2000(lab1: LAB, lab2: LAB): number {
  // 参考: https://en.wikipedia.org/wiki/Color_difference#CIEDE2000
  
  const L1 = lab1.l;
  const a1 = lab1.a;
  const b1 = lab1.b;
  const L2 = lab2.l;
  const a2 = lab2.a;
  const b2 = lab2.b;

  // 权重因子
  const kL = 1.0;
  const kC = 1.0;
  const kH = 1.0;

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

  // 最终 CIEDE2000 色差
  const deltaE = Math.sqrt(
    Math.pow(deltaLPrime / (kL * SL), 2) +
    Math.pow(deltaCPrime / (kC * SC), 2) +
    Math.pow(deltaHPrime / (kH * SH), 2) +
    RT * (deltaCPrime / (kC * SC)) * (deltaHPrime / (kH * SH))
  );

  return deltaE;
}

// 简化版色差（更快但不够精确）
export function deltaESimple(lab1: LAB, lab2: LAB): number {
  const dl = lab1.l - lab2.l;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;

  return Math.sqrt(dl * dl + da * da + db * db);
}

// RGB 转 HEX
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

// HEX 转 RGB
export function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}
