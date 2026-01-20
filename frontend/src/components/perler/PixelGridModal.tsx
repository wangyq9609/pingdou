import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button } from 'antd';
import { CloseOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import { Stage, Layer, Rect } from 'react-konva';
import type { PixelData } from '../../utils/imageProcessor';
import type { BrandType } from './PerlerGenerator';

interface PixelGridModalProps {
  visible: boolean;
  pixels: PixelData[][];
  onClose: () => void;
  showGrid?: boolean;
  selectedBrand?: BrandType;
  onPixelHover?: (pixel: PixelData | null, x?: number, y?: number) => void;
}

const PixelGridModal: React.FC<PixelGridModalProps> = ({
  visible,
  pixels,
  onClose,
  showGrid = true,
  onPixelHover,
}) => {
  const [cellSize, setCellSize] = useState(20);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const hoveredPixelRef = useRef<PixelData | null>(null);

  // 计算初始 cellSize，使图片适应窗口
  useEffect(() => {
    if (!visible || pixels.length === 0 || !containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth - 100; // 留出边距
    const containerHeight = container.clientHeight - 150; // 留出边距和工具栏

    const pixelWidth = pixels[0].length;
    const pixelHeight = pixels.length;

    const maxCellSizeX = containerWidth / pixelWidth;
    const maxCellSizeY = containerHeight / pixelHeight;
    const optimalCellSize = Math.min(maxCellSizeX, maxCellSizeY);

    // 设置一个合理的初始 cellSize（至少 10px，最多 50px）
    const initialCellSize = Math.max(10, Math.min(optimalCellSize, 50));
    setCellSize(initialCellSize);
  }, [visible, pixels]);

  // 更新 Stage 尺寸
  useEffect(() => {
    if (pixels.length === 0) return;
    const width = pixels[0].length * cellSize;
    const height = pixels.length * cellSize;
    setStageSize({ width, height });
  }, [pixels, cellSize]);

  const handleZoomIn = () => {
    setCellSize((prev) => Math.min(prev + 5, 100));
  };

  const handleZoomOut = () => {
    setCellSize((prev) => Math.max(prev - 5, 5));
  };

  const handleReset = () => {
    if (!containerRef.current || pixels.length === 0) return;
    const container = containerRef.current;
    const containerWidth = container.clientWidth - 100;
    const containerHeight = container.clientHeight - 150;

    const pixelWidth = pixels[0].length;
    const pixelHeight = pixels.length;

    const maxCellSizeX = containerWidth / pixelWidth;
    const maxCellSizeY = containerHeight / pixelHeight;
    const optimalCellSize = Math.min(maxCellSizeX, maxCellSizeY);
    const resetCellSize = Math.max(10, Math.min(optimalCellSize, 50));
    setCellSize(resetCellSize);
  };

  // 鼠标滚轮缩放
  useEffect(() => {
    if (!visible || !containerRef.current) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -2 : 2;
      setCellSize((prev) => Math.max(5, Math.min(100, prev + delta)));
    };

    const container = containerRef.current;
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [visible]);

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width="90%"
      style={{ top: 20 }}
      styles={{
        body: {
          padding: '16px',
          height: 'calc(100vh - 100px)',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      className="pixel-grid-modal"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">放大预览</span>
          <span className="text-xs text-gray-500">
            ({pixels[0]?.length || 0} × {pixels.length || 0} 像素)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            icon={<ZoomOutOutlined />}
            size="small"
            onClick={handleZoomOut}
            disabled={cellSize <= 5}
          >
            缩小
          </Button>
          <Button
            icon={<ZoomInOutlined />}
            size="small"
            onClick={handleZoomIn}
            disabled={cellSize >= 100}
          >
            放大
          </Button>
          <Button size="small" onClick={handleReset}>
            适应窗口
          </Button>
          <Button
            icon={<CloseOutlined />}
            size="small"
            onClick={onClose}
          >
            关闭
          </Button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-50 rounded-lg flex items-center justify-center p-4"
        style={{ minHeight: 0 }}
      >
        {stageSize.width > 0 && stageSize.height > 0 && (
          <div
            style={{
              width: stageSize.width,
              height: stageSize.height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Stage width={stageSize.width} height={stageSize.height}>
              <Layer>
                {pixels.map((row, y) =>
                  row.map((pixel, x) => (
                    <Rect
                      key={`${x}-${y}`}
                      x={x * cellSize}
                      y={y * cellSize}
                      width={cellSize}
                      height={cellSize}
                      fill={pixel.color.hex}
                      stroke={showGrid && cellSize > 3 ? '#e5e7eb' : undefined}
                      strokeWidth={showGrid && cellSize > 3 ? Math.max(0.5, cellSize / 40) : 0}
                      onMouseEnter={(e) => {
                        hoveredPixelRef.current = pixel;
                        const stage = e.target.getStage();
                        if (stage) {
                          const pointerPos = stage.getPointerPosition();
                          if (pointerPos && e.evt) {
                            // 直接使用鼠标事件的客户端坐标，更准确
                            onPixelHover?.(pixel, e.evt.clientX, e.evt.clientY);
                          }
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
          </div>
        )}
      </div>
      <div className="mt-2 text-xs text-gray-500 text-center">
        当前显示尺寸: {cellSize.toFixed(1)}px/像素 | 使用鼠标滚轮或工具栏按钮缩放
      </div>
    </Modal>
  );
};

export default PixelGridModal;
