import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type { PixelData } from '../../utils/imageProcessor';
import type { BrandType } from './PerlerGenerator';

interface PixelGridProps {
  pixels: PixelData[][];
  showGrid?: boolean;
  autoFit?: boolean; // 是否自动适应容器
  onPixelClick?: (pixel: PixelData) => void;
  onImageClick?: () => void; // 点击图片打开放大窗口
  selectedBrand?: BrandType; // 选择的品牌
  onPixelHover?: (pixel: PixelData | null, x?: number, y?: number) => void; // 像素悬浮回调，包含鼠标位置
}

const PixelGrid: React.FC<PixelGridProps> = ({
  pixels,
  showGrid = true,
  autoFit = true,
  onPixelClick,
  onImageClick,
  selectedBrand: _selectedBrand,
  onPixelHover,
}) => {
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [actualCellSize, setActualCellSize] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoveredPixelRef = useRef<PixelData | null>(null);

  // 计算自适应缩放
  const calculateAutoFit = useCallback(() => {
    if (!containerRef.current || pixels.length === 0) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth - 20; // 留出边距
    const containerHeight = container.clientHeight - 20;

    const pixelWidth = pixels[0].length;
    const pixelHeight = pixels.length;

    // 计算合适的 cellSize，使图片能够完整显示在容器内
    const maxCellSizeX = containerWidth / pixelWidth;
    const maxCellSizeY = containerHeight / pixelHeight;
    const optimalCellSize = Math.min(maxCellSizeX, maxCellSizeY);

    // 确保 cellSize 至少为 1，但不超过一个合理上限（如 50px）
    const cellSize = Math.max(1, Math.min(optimalCellSize, 50));

    const imageWidth = pixelWidth * cellSize;
    const imageHeight = pixelHeight * cellSize;

    setActualCellSize(cellSize);
    setStageSize({ width: imageWidth, height: imageHeight });
  }, [pixels]);

  useEffect(() => {
    if (autoFit) {
      calculateAutoFit();
    } else {
      // 如果不自动适应，使用默认的 cellSize
      const defaultCellSize = 20;
      const width = pixels[0]?.length * defaultCellSize || 0;
      const height = pixels.length * defaultCellSize || 0;
      setStageSize({ width, height });
      setActualCellSize(defaultCellSize);
    }
  }, [pixels, autoFit, calculateAutoFit]);

  // 监听容器大小变化
  useEffect(() => {
    if (!autoFit || !containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      calculateAutoFit();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [autoFit, calculateAutoFit]);

  if (!pixels || pixels.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <p className="text-gray-500">请上传图片开始生成</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-auto bg-white rounded-lg shadow-inner flex items-center justify-center p-2 cursor-pointer hover:bg-gray-50 transition-colors"
      style={{ maxWidth: '100%', minHeight: '400px' }}
      onClick={onImageClick}
      title="点击放大查看"
    >
      <div
        style={{
          width: stageSize.width || 'auto',
          height: stageSize.height || 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        onClick={(e) => e.stopPropagation()} // 阻止事件冒泡，让点击像素时不会触发放大
      >
        {stageSize.width > 0 && stageSize.height > 0 && (
          <Stage width={stageSize.width} height={stageSize.height}>
            <Layer>
              {pixels.map((row, y) =>
                row.map((pixel, x) => (
                  <Rect
                    key={`${x}-${y}`}
                    x={x * actualCellSize}
                    y={y * actualCellSize}
                    width={actualCellSize}
                    height={actualCellSize}
                    fill={pixel.color.hex}
                    stroke={showGrid && actualCellSize > 3 ? '#e5e7eb' : undefined}
                    strokeWidth={showGrid && actualCellSize > 3 ? Math.max(0.3, actualCellSize / 40) : 0}
                    onClick={(e) => {
                      if (e.evt) {
                        e.evt.stopPropagation();
                      }
                      onPixelClick?.(pixel);
                    }}
                    onTap={(e) => {
                      if (e.evt) {
                        e.evt.stopPropagation();
                      }
                      onPixelClick?.(pixel);
                    }}
                    onMouseEnter={(e) => {
                      hoveredPixelRef.current = pixel;
                      if (e.evt) {
                        // 直接使用鼠标事件的客户端坐标，更准确
                        onPixelHover?.(pixel, e.evt.clientX, e.evt.clientY);
                      }
                    }}
                    onMouseLeave={() => {
                      hoveredPixelRef.current = null;
                      onPixelHover?.(null);
                    }}
                    onMouseMove={(e) => {
                      if (hoveredPixelRef.current && e.evt) {
                        // 直接使用鼠标事件的客户端坐标，更准确
                        onPixelHover?.(hoveredPixelRef.current, e.evt.clientX, e.evt.clientY);
                      }
                    }}
                  />
                ))
              )}
            </Layer>
          </Stage>
        )}
      </div>
    </div>
  );
};

export default PixelGrid;
