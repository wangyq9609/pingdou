import crypto from 'crypto';

// 生成兑换码：格式 XXXX-XXXX-XXXX-XXXX
export function generateRedemptionCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 去除易混淆字符 0,O,1,I
  const segments = 4;
  const segmentLength = 4;
  
  const code = Array.from({ length: segments }, () => {
    return Array.from({ length: segmentLength }, () => {
      const randomIndex = crypto.randomInt(0, chars.length);
      return chars[randomIndex];
    }).join('');
  }).join('-');
  
  return code;
}

// 添加校验位（可选）
export function addChecksum(code: string): string {
  const hash = crypto.createHash('md5').update(code).digest('hex');
  return `${code}-${hash.substring(0, 4).toUpperCase()}`;
}

// 验证兑换码格式
export function validateCodeFormat(code: string): boolean {
  // 格式：XXXX-XXXX-XXXX-XXXX
  const pattern = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/;
  return pattern.test(code);
}

// 批量生成兑换码
export function generateBatchCodes(quantity: number): string[] {
  const codes = new Set<string>();
  
  while (codes.size < quantity) {
    codes.add(generateRedemptionCode());
  }
  
  return Array.from(codes);
}
