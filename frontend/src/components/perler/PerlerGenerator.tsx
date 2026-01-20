import React, { useState, useCallback } from 'react';
import { UploadOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Slider, Switch, Upload as AntUpload, message, Card, Space, Divider, Select } from 'antd';
import type { PixelData } from '../../utils/imageProcessor';
import PixelGrid from './PixelGrid';
import PixelGridModal from './PixelGridModal';
import MaterialList from './MaterialList';
import {
  processImageToPerler,
  ProcessOptions,
  DEFAULT_OPTIONS,
  ProcessResult,
  generateMaterialList,
} from '../../utils/imageProcessor';

// 品牌类型定义
export type BrandType = 'MARD' | 'COCO' | '漫漫' | '盼盼' | '咪小窝' | 'none';

const PerlerGenerator: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [options, setOptions] = useState<ProcessOptions>(DEFAULT_OPTIONS);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<BrandType>('MARD');
  const [hoveredPixel, setHoveredPixel] = useState<PixelData | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [showColorCodes, setShowColorCodes] = useState(false); // 是否生成色号图

  // 处理图片
  const handleProcess = useCallback(async () => {
    if (!file) {
      message.warning('请先上传图片');
      return;
    }

    setProcessing(true);
    try {
      // 如果选择了品牌，只使用有该品牌色号的颜色
      let colorPalette = options.colorPalette;
      if (selectedBrand !== 'none') {
        colorPalette = options.colorPalette.filter(
          color => color.brandCodes?.[selectedBrand]
        );
        if (colorPalette.length === 0) {
          message.error(`所选品牌 ${selectedBrand} 没有可用颜色`);
          setProcessing(false);
          return;
        }
      }

      const processed = await processImageToPerler(file, {
        ...options,
        colorPalette,
      });
      setResult(processed);
      message.success('处理完成！');
    } catch (error) {
      console.error('处理失败:', error);
      message.error('图片处理失败，请重试');
    } finally {
      setProcessing(false);
    }
  }, [file, options, selectedBrand]);

  // 文件上传处理
  const handleFileChange = (info: any) => {
    // 兼容 beforeUpload 返回 false 的情况
    const file = (info.file.originFileObj || info.file) as File;
    
    if (!file) {
      message.error('文件获取失败');
      return;
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      message.error('请上传图片文件');
      return;
    }

    // 验证文件大小（限制为 10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      message.error('图片大小不能超过 10MB');
      return;
    }

    setFile(file);
    setResult(null);
    message.success(`已选择图片: ${file.name}`);
  };

  // 计算颜色的亮度，用于确定文字颜色
  const getLuminance = (hex: string): number => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    // 使用相对亮度公式
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };

  // 导出为图片
  const handleExportImage = () => {
    if (!result) return;

    const canvas = document.createElement('canvas');
    // 如果显示色号，需要更大的单元格来容纳文字
    const cellSize = showColorCodes ? 30 : 20;
    canvas.width = result.width * cellSize;
    canvas.height = result.height * cellSize;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // 设置文字样式
    if (showColorCodes) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // 根据单元格大小自适应字体大小
      const fontSize = Math.max(8, Math.min(12, cellSize * 0.35));
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    }

    // 绘制像素
    result.pixels.forEach((row, y) => {
      row.forEach((pixel, x) => {
        const xPos = x * cellSize;
        const yPos = y * cellSize;

        // 绘制像素颜色
        ctx.fillStyle = pixel.color.hex;
        ctx.fillRect(xPos, yPos, cellSize, cellSize);
        
        // 绘制边框
        ctx.strokeStyle = '#e5e7eb';
        ctx.strokeRect(xPos, yPos, cellSize, cellSize);

        // 如果启用色号显示，绘制色号文字
        if (showColorCodes) {
          // 获取色号
          let colorCode = '';
          if (selectedBrand !== 'none' && pixel.color.brandCodes?.[selectedBrand]) {
            colorCode = pixel.color.brandCodes[selectedBrand];
          } else {
            // 如果没有品牌色号，使用颜色ID或hex
            colorCode = pixel.color.id || pixel.color.hex.slice(1).toUpperCase();
          }

          // 根据背景亮度选择文字颜色
          const luminance = getLuminance(pixel.color.hex);
          const textColor = luminance > 0.5 ? '#000000' : '#FFFFFF';
          const strokeColor = luminance > 0.5 ? '#FFFFFF' : '#000000';
          
          // 绘制文字（添加描边以提高可读性）
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = Math.max(1, cellSize / 20);
          ctx.strokeText(colorCode, xPos + cellSize / 2, yPos + cellSize / 2);
          ctx.fillStyle = textColor;
          ctx.fillText(colorCode, xPos + cellSize / 2, yPos + cellSize / 2);
        }
      });
    });

    // 下载
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = showColorCodes 
          ? `perler-pattern-with-codes-${Date.now()}.png`
          : `perler-pattern-${Date.now()}.png`;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        message.success('图片已导出');
      }
    });
  };

  // 导出材料清单为文本
  const handleExportMaterialList = () => {
    if (!result) return;

    const materials = generateMaterialList(result, options.colorPalette);
    const total = result.width * result.height;

    let content = '拼豆材料清单\n';
    content += '='.repeat(30) + '\n';
    content += `图案尺寸: ${result.width} x ${result.height} (共 ${total} 颗)\n`;
    if (selectedBrand !== 'none') {
      content += `品牌色号: ${selectedBrand}\n`;
    }
    content += '\n颜色清单:\n';
    content += '-'.repeat(30) + '\n';

    materials.forEach((item, index) => {
      const percentage = ((item.count / total) * 100).toFixed(1);
      content += `${index + 1}. ${item.color.name} (${item.color.nameEn})\n`;
      content += `   数量: ${item.count} 颗 (${percentage}%)\n`;
      content += `   颜色代码: ${item.color.hex}\n`;
      if (selectedBrand !== 'none' && item.color.brandCodes?.[selectedBrand]) {
        content += `   ${selectedBrand}色号: ${item.color.brandCodes[selectedBrand]}\n`;
      }
      content += '\n';
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `perler-materials-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('材料清单已导出');
  };

  // 处理像素悬浮
  const handlePixelHover = useCallback((pixel: PixelData | null, x?: number, y?: number) => {
    setHoveredPixel(pixel);
    if (pixel && x !== undefined && y !== undefined) {
      setPopoverPosition({ x, y });
    }
  }, []);

  const materials = result
    ? generateMaterialList(result, options.colorPalette)
    : [];
  const totalPixels = result ? result.width * result.height : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">拼豆像素图生成器</h1>
        <p className="text-gray-600">上传图片，自动转换为拼豆图案</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：上传和参数控制 */}
        <div className="lg:col-span-1 space-y-4">
          <Card title="图片上传" className="shadow-sm">
            <AntUpload
              accept="image/*"
              showUploadList={false}
              beforeUpload={(file) => {
                // 验证文件类型
                const isImage = file.type.startsWith('image/');
                if (!isImage) {
                  message.error('只能上传图片文件！');
                  return false;
                }
                // 验证文件大小（10MB）
                const isLt10M = file.size / 1024 / 1024 < 10;
                if (!isLt10M) {
                  message.error('图片大小不能超过 10MB！');
                  return false;
                }
                return false; // 阻止自动上传
              }}
              onChange={handleFileChange}
              className="w-full"
            >
              <Button
                icon={<UploadOutlined />}
                block
                size="large"
                className="mb-4"
              >
                选择图片
              </Button>
            </AntUpload>
            {file && (
              <div className="text-sm text-gray-600 mb-4">
                已选择: {file.name}
              </div>
            )}
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              block
              size="large"
              loading={processing}
              onClick={handleProcess}
              disabled={!file}
            >
              {processing ? '处理中...' : '生成拼豆图'}
            </Button>
          </Card>

          <Card title="参数设置" className="shadow-sm">
            <Space direction="vertical" className="w-full" size="large">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">像素尺寸</span>
                  <span className="text-sm text-gray-600">{options.pixelSize}</span>
                </div>
                <Slider
                  min={20}
                  max={200}
                  value={options.pixelSize}
                  onChange={(value) =>
                    setOptions({ ...options, pixelSize: value })
                  }
                />
                <div className="text-xs text-gray-500 mt-1">
                  控制图案的精细程度，数值越大越精细
                </div>
              </div>

              <Divider className="my-2" />

              <div>
                <div className="mb-2">
                  <span className="text-sm font-medium">品牌色号</span>
                </div>
                <Select
                  value={selectedBrand}
                  onChange={(value) => setSelectedBrand(value)}
                  className="w-full"
                  options={[
                    { label: 'MARD', value: 'MARD' },
                    { label: 'COCO', value: 'COCO' },
                    { label: '漫漫', value: '漫漫' },
                    { label: '盼盼', value: '盼盼' },
                    { label: '咪小窝', value: '咪小窝' },
                  ]}
                />
                <div className="text-xs text-gray-500 mt-1">
                  选择要在材料清单中显示的品牌色号
                </div>
              </div>

              <Divider className="my-2" />

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">亮度</span>
                  <span className="text-sm text-gray-600">{options.brightness}</span>
                </div>
                <Slider
                  min={-100}
                  max={100}
                  value={options.brightness}
                  onChange={(value) =>
                    setOptions({ ...options, brightness: value })
                  }
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">对比度</span>
                  <span className="text-sm text-gray-600">{options.contrast}</span>
                </div>
                <Slider
                  min={-100}
                  max={100}
                  value={options.contrast}
                  onChange={(value) =>
                    setOptions({ ...options, contrast: value })
                  }
                />
              </div>

              <Divider className="my-2" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">颜色抖动</span>
                <Switch
                  checked={options.dithering}
                  onChange={(checked) =>
                    setOptions({ ...options, dithering: checked })
                  }
                />
              </div>
              <div className="text-xs text-gray-500">
                启用后可以改善渐变效果，但处理时间更长
              </div>

              <Divider className="my-2" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">生成色号图</span>
                <Switch
                  checked={showColorCodes}
                  onChange={(checked) => setShowColorCodes(checked)}
                  disabled={!result}
                />
              </div>
              <div className="text-xs text-gray-500">
                导出时在每个像素上显示色号，方便制作拼豆图纸
              </div>

            </Space>
          </Card>
        </div>

        {/* 中间：预览区域 */}
        <div className="lg:col-span-1">
          <Card
            title="预览"
            extra={
              result && (
                <Button
                  type="link"
                  icon={<DownloadOutlined />}
                  onClick={handleExportImage}
                  size="small"
                >
                  导出图片
                </Button>
              )
            }
            className="shadow-sm"
            styles={{
              body: {
                padding: '16px',
                height: '600px',
                display: 'flex',
                flexDirection: 'column',
              },
            }}
          >
            <div className="flex-1 flex flex-col min-h-0">
              {result ? (
                <>
                  <div className="flex-1 min-h-0 overflow-hidden relative">
                    <PixelGrid
                      pixels={result.pixels}
                      showGrid={true}
                      autoFit={true}
                      onImageClick={() => setModalVisible(true)}
                      selectedBrand={selectedBrand}
                      onPixelHover={handlePixelHover}
                    />
                    {hoveredPixel && (
                      <div
                        className="fixed z-50 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap"
                        style={{
                          left: `${popoverPosition.x + 5}px`,
                          top: `${popoverPosition.y - 5}px`,
                        }}
                      >
                        {selectedBrand !== 'none' && hoveredPixel.color.brandCodes?.[selectedBrand] ? (
                          <div className="font-semibold">{hoveredPixel.color.brandCodes[selectedBrand]}</div>
                        ) : (
                          <div>{hoveredPixel.color.hex}</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 text-sm text-gray-600 text-center space-y-1 flex-shrink-0">
                    <div>尺寸: {result.width} × {result.height} 像素</div>
                    <div className="text-xs text-gray-500">
                      图片已自动适应预览窗口大小，点击图片可放大查看
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-center text-gray-400">
                  <div>
                    <UploadOutlined className="text-6xl mb-4 opacity-50" />
                    <p>上传图片并点击"生成拼豆图"开始</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* 右侧：材料清单 */}
        <div className="lg:col-span-1">
          <Card
            title="材料清单"
            extra={
              result && (
                <Button
                  type="link"
                  icon={<DownloadOutlined />}
                  onClick={handleExportMaterialList}
                  size="small"
                >
                  导出清单
                </Button>
              )
            }
            className="shadow-sm"
          >
            <MaterialList materials={materials} totalPixels={totalPixels} selectedBrand={selectedBrand} />
          </Card>
        </div>
      </div>

      {/* 放大预览 Modal */}
      {result && (
        <PixelGridModal
          visible={modalVisible}
          pixels={result.pixels}
          onClose={() => {
            setModalVisible(false);
            setHoveredPixel(null);
          }}
          showGrid={true}
          selectedBrand={selectedBrand}
          onPixelHover={handlePixelHover}
        />
      )}

      {/* 悬浮提示框 - 用于Modal */}
      {hoveredPixel && modalVisible && (
        <div
          className="fixed z-[9999] bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap"
          style={{
            left: `${popoverPosition.x + 5}px`,
            top: `${popoverPosition.y - 5}px`,
          }}
        >
          {selectedBrand !== 'none' && hoveredPixel.color.brandCodes?.[selectedBrand] ? (
            <div className="font-semibold">{hoveredPixel.color.brandCodes[selectedBrand]}</div>
          ) : (
            <div>{hoveredPixel.color.hex}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default PerlerGenerator;
