import { useEffect, useRef } from 'react';
import { GridCell } from '../../types';

interface ColorComparisonCanvasProps {
  originalImageData: ImageData;
  gridData: GridCell[][];
  scale?: number;
}

const ColorComparisonCanvas: React.FC<ColorComparisonCanvasProps> = ({
  originalImageData,
  gridData,
  scale = 10
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gridData || gridData.length === 0) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const width = gridData[0].length;
    const height = gridData.length;

    // 设置画布尺寸：左侧原图 + 右侧拼豆效果
    canvas.width = width * scale * 2;
    canvas.height = height * scale;

    // 绘制原图（左侧）
    const origData = originalImageData.data;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = origData[idx];
        const g = origData[idx + 1];
        const b = origData[idx + 2];
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }

    // 绘制分隔线
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width * scale, 0);
    ctx.lineTo(width * scale, height * scale);
    ctx.stroke();

    // 绘制拼豆效果（右侧）
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = gridData[y][x];
        const { r, g, b } = cell.color.rgb;
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect((width + x) * scale, y * scale, scale, scale);
      }
    }
  }, [originalImageData, gridData, scale]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="border rounded shadow-sm bg-white"
        style={{
          maxWidth: '100%',
          height: 'auto',
          imageRendering: 'pixelated'
        }}
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
        <span>← 原始颜色</span>
        <span>拼豆颜色 →</span>
      </div>
    </div>
  );
};

export default ColorComparisonCanvas;
