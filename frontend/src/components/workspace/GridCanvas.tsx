import { useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Line } from 'react-konva';
import { GridCell } from '../../types';

interface GridCanvasProps {
  gridData: GridCell[][] | null;
  showGrid: boolean;
  cellSize?: number;
}

const GridCanvas: React.FC<GridCanvasProps> = ({ gridData, showGrid, cellSize = 20 }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!gridData || gridData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded">
        <p className="text-gray-500">暂无图纸数据</p>
      </div>
    );
  }

  const height = gridData.length;
  const width = gridData[0].length;
  const stageWidth = width * cellSize;
  const stageHeight = height * cellSize;

  return (
    <div ref={containerRef} className="overflow-auto border rounded bg-white">
      <Stage width={stageWidth} height={stageHeight}>
        <Layer>
          {/* 绘制颜色单元格 */}
          {gridData.map((row, y) =>
            row.map((cell, x) => (
              <Rect
                key={`${x}-${y}`}
                x={x * cellSize}
                y={y * cellSize}
                width={cellSize}
                height={cellSize}
                fill={cell.color.hex}
              />
            ))
          )}

          {/* 绘制网格线 */}
          {showGrid && (
            <>
              {/* 垂直线 */}
              {Array.from({ length: width + 1 }).map((_, i) => (
                <Line
                  key={`v-${i}`}
                  points={[i * cellSize, 0, i * cellSize, stageHeight]}
                  stroke="#ddd"
                  strokeWidth={1}
                />
              ))}
              {/* 水平线 */}
              {Array.from({ length: height + 1 }).map((_, i) => (
                <Line
                  key={`h-${i}`}
                  points={[0, i * cellSize, stageWidth, i * cellSize]}
                  stroke="#ddd"
                  strokeWidth={1}
                />
              ))}
            </>
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default GridCanvas;
