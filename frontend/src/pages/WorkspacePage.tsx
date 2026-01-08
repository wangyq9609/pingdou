import { useState } from 'react';
import { Row, Col, Card, Button, Slider, Select, Switch, Space, message } from 'antd';
import { DownloadOutlined, SaveOutlined } from '@ant-design/icons';
import Header from '../components/common/Header';
import ImageUploader from '../components/workspace/ImageUploader';
import GridCanvas from '../components/workspace/GridCanvas';
import MaterialList from '../components/workspace/MaterialList';
import ColorPalette from '../components/workspace/ColorPalette';
import { useAppStore } from '../store/useAppStore';
import { getPalette } from '../data/beadPalettes';
import { resizeImage, quantizeColors, imageToGrid } from '../utils/imageProcessor';

const WorkspacePage: React.FC = () => {
  const {
    originalImage,
    gridData,
    selectedPalette,
    gridSize,
    colorCount,
    showGrid,
    setOriginalImage,
    setGridData,
    setSelectedPalette,
    setGridSize,
    setColorCount,
    setShowGrid,
  } = useAppStore();

  const [brand, setBrand] = useState<'Perler' | 'Hama'>('Perler');
  const [processing, setProcessing] = useState(false);

  // 初始化色板
  useState(() => {
    if (selectedPalette.length === 0) {
      setSelectedPalette(getPalette(brand));
    }
  });

  const handleImageLoad = (image: HTMLImageElement) => {
    setOriginalImage(image);
    setGridData(null); // 清空之前的网格数据
    message.info('请点击"开始转换"按钮');
  };

  const handleBrandChange = (newBrand: 'Perler' | 'Hama') => {
    setBrand(newBrand);
    setSelectedPalette(getPalette(newBrand));
  };

  const handleConvert = async () => {
    if (!originalImage) {
      message.warning('请先上传图片');
      return;
    }

    const availableColors = selectedPalette.filter(c => c.available);
    if (availableColors.length === 0) {
      message.warning('请至少选择一种颜色');
      return;
    }

    setProcessing(true);
    try {
      // 调整图片尺寸
      const imageData = await resizeImage(originalImage, gridSize.width, gridSize.height);

      // 颜色量化
      const usedColors = quantizeColors(imageData, availableColors, colorCount);

      // 生成网格
      const grid = imageToGrid(imageData, usedColors, gridSize.width, gridSize.height);

      setGridData(grid);
      message.success('转换成功！');
    } catch (error) {
      console.error('转换失败:', error);
      message.error('转换失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  const handleExportPNG = async () => {
    if (!gridData) {
      message.warning('请先转换图片');
      return;
    }

    try {
      const { exportToPNG } = await import('../utils/exportUtils');
      await exportToPNG(gridData, 20, showGrid);
      message.success('PNG导出成功！');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('PNG导出失败');
    }
  };

  const handleExportPDF = async () => {
    if (!gridData) {
      message.warning('请先转换图片');
      return;
    }

    try {
      const { exportToPDF } = await import('../utils/exportUtils');
      await exportToPDF(gridData, 15);
      message.success('PDF导出成功！');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('PDF导出失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Row gutter={[16, 16]}>
          {/* 左侧工具栏 */}
          <Col xs={24} lg={6}>
            <Space direction="vertical" className="w-full" size="middle">
              {/* 图片上传 */}
              <Card title="上传图片" size="small">
                <ImageUploader onImageLoad={handleImageLoad} />
                {originalImage && (
                  <div className="mt-4 text-center">
                    <img
                      src={originalImage.src}
                      alt="原图"
                      className="max-w-full rounded border"
                      style={{ maxHeight: '200px' }}
                    />
                  </div>
                )}
              </Card>

              {/* 尺寸设置 */}
              <Card title="尺寸设置" size="small">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2">宽度: {gridSize.width}</label>
                    <Slider
                      min={10}
                      max={100}
                      value={gridSize.width}
                      onChange={(value) => setGridSize({ ...gridSize, width: value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">高度: {gridSize.height}</label>
                    <Slider
                      min={10}
                      max={100}
                      value={gridSize.height}
                      onChange={(value) => setGridSize({ ...gridSize, height: value })}
                    />
                  </div>
                </div>
              </Card>

              {/* 色板选择 */}
              <Card title="色板品牌" size="small">
                <Select
                  value={brand}
                  onChange={handleBrandChange}
                  className="w-full"
                  options={[
                    { label: 'Perler', value: 'Perler' },
                    { label: 'Hama', value: 'Hama' },
                  ]}
                />
              </Card>

              {/* 颜色数量 */}
              <Card title="颜色数量" size="small">
                <div>
                  <label className="block text-sm mb-2">最多使用: {colorCount} 种颜色</label>
                  <Slider
                    min={4}
                    max={32}
                    step={4}
                    value={colorCount}
                    onChange={setColorCount}
                  />
                </div>
              </Card>

              {/* 操作按钮 */}
              <Card title="操作" size="small">
                <Space direction="vertical" className="w-full">
                  <Button
                    type="primary"
                    block
                    size="large"
                    loading={processing}
                    onClick={handleConvert}
                    disabled={!originalImage}
                  >
                    开始转换
                  </Button>
                  <Button
                    block
                    icon={<DownloadOutlined />}
                    onClick={handleExportPNG}
                    disabled={!gridData}
                  >
                    导出 PNG
                  </Button>
                  <Button
                    block
                    icon={<DownloadOutlined />}
                    onClick={handleExportPDF}
                    disabled={!gridData}
                  >
                    导出 PDF
                  </Button>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm">显示网格</span>
                    <Switch checked={showGrid} onChange={setShowGrid} />
                  </div>
                </Space>
              </Card>
            </Space>
          </Col>

          {/* 中间画布区域 */}
          <Col xs={24} lg={12}>
            <Card title="图纸预览">
              <GridCanvas gridData={gridData} showGrid={showGrid} cellSize={15} />
            </Card>
          </Col>

          {/* 右侧色板和材料清单 */}
          <Col xs={24} lg={6}>
            <Space direction="vertical" className="w-full" size="middle">
              <ColorPalette
                palette={selectedPalette}
                onPaletteChange={setSelectedPalette}
              />
              {gridData && <MaterialList gridData={gridData} />}
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default WorkspacePage;
