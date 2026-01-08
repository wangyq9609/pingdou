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

// CIEDE2000 色差计算（简化版）
export function deltaE2000(lab1: LAB, lab2: LAB): number {
  // 简化版的 CIEDE2000，使用欧几里得距离作为近似
  // 完整的 CIEDE2000 算法非常复杂，这里使用加权欧几里得距离
  const dl = lab1.l - lab2.l;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;

  // 加权系数
  const kl = 1.0;
  const kc = 1.0;
  const kh = 1.0;

  // 计算色度
  const c1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b);
  const c2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b);
  const dc = c1 - c2;

  // 计算色调差
  const dh = Math.sqrt(da * da + db * db - dc * dc);

  // 加权距离
  const deltaE = Math.sqrt(
    Math.pow(dl / kl, 2) +
    Math.pow(dc / kc, 2) +
    Math.pow(dh / kh, 2)
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
