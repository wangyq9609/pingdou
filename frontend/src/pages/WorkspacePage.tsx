import { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Slider, Select, Switch, Space, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import Header from '../components/common/Header';
import ImageUploader from '../components/workspace/ImageUploader';
import GridCanvas from '../components/workspace/GridCanvas';
import MaterialList from '../components/workspace/MaterialList';
import ColorPalette from '../components/workspace/ColorPalette';
import ColorComparisonCanvas from '../components/workspace/ColorComparisonCanvas';
import { useAppStore } from '../store/useAppStore';
import { getPalette } from '../data/beadPalettes';
import { 
  resizeImage, 
  quantizeColors, 
  imageToGrid, 
  preprocessImage, 
  ImageProcessOptions, 
  DitheringMethod,
  ProcessProgress,
  CancellationToken,
  analyzeImageAndRecommend,
  RecommendedParams,
  generateQuickPreview,
  analyzeColorMatchQuality,
  ColorMatchQuality
} from '../utils/imageProcessor';
import { saveSettings, loadSettings, SavedSettings } from '../utils/storage';

const WorkspacePage: React.FC = () => {
  const {
    originalImage,
    gridData,
    selectedPalette,
    gridSize,
    colorCount,
    showGrid,
    useDithering,
    setOriginalImage,
    setGridData,
    setSelectedPalette,
    setGridSize,
    setColorCount,
    setShowGrid,
    setUseDithering,
  } = useAppStore();

  const [brand, setBrand] = useState<'Perler' | 'Hama'>('Perler');
  const [processing, setProcessing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [progress, setProgress] = useState<ProcessProgress | null>(null);
  const [cancellationToken, setCancellationToken] = useState<CancellationToken | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendedParams | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [matchQuality, setMatchQuality] = useState<ColorMatchQuality | null>(null);
  const [showColorComparison, setShowColorComparison] = useState(false); // 显示颜色对比
  const [processedImageData, setProcessedImageData] = useState<ImageData | null>(null); // 存储处理后的图像数据
  
  // 图像处理参数
  const [contrast, setContrast] = useState(1.2);
  const [brightness, setBrightness] = useState(1.0);
  const [saturation, setSaturation] = useState(1.1);
  const [sharpen, setSharpen] = useState(true);
  const [ditheringMethod, setDitheringMethod] = useState<DitheringMethod>('floyd-steinberg');
  const [preserveColors, setPreserveColors] = useState(false); // 精确颜色模式

  // 加载保存的设置
  useEffect(() => {
    const saved = loadSettings();
    if (saved) {
      setGridSize(saved.gridSize);
      setColorCount(saved.colorCount);
      setContrast(saved.contrast);
      setBrightness(saved.brightness);
      setSaturation(saved.saturation);
      setSharpen(saved.sharpen);
      setDitheringMethod(saved.ditheringMethod);
      setUseDithering(saved.useDithering);
      setBrand(saved.brand);
      setShowGrid(saved.showGrid);
      if (saved.preserveColors !== undefined) {
        setPreserveColors(saved.preserveColors);
      }
      message.success('已加载上次的参数设置');
    }
  }, []);

  // 自动保存设置（防抖）
  useEffect(() => {
    const timer = setTimeout(() => {
      const settings: SavedSettings = {
        gridSize,
        colorCount,
        contrast,
        brightness,
        saturation,
        sharpen,
        ditheringMethod,
        useDithering,
        brand,
        showGrid,
        preserveColors,
      };
      saveSettings(settings);
    }, 1000);

    return () => clearTimeout(timer);
  }, [gridSize, colorCount, contrast, brightness, saturation, sharpen, ditheringMethod, useDithering, brand, showGrid, preserveColors]);

  // 参数预设模板
  interface Preset {
    name: string;
    description: string;
    gridSize: { width: number; height: number };
    colorCount: number;
    contrast: number;
    brightness: number;
    saturation: number;
    sharpen: boolean;
    ditheringMethod: DitheringMethod;
    preserveColors: boolean;
  }

  const presets: Record<string, Preset> = {
    portrait: {
      name: '人像照片',
      description: '柔和过渡，自然肤色',
      gridSize: { width: 40, height: 50 },
      colorCount: 18,
      contrast: 1.3,
      brightness: 1.1,
      saturation: 1.0,
      sharpen: true,
      ditheringMethod: 'atkinson',
      preserveColors: false,
    },
    landscape: {
      name: '风景照片',
      description: '色彩丰富，细节清晰',
      gridSize: { width: 50, height: 40 },
      colorCount: 20,
      contrast: 1.2,
      brightness: 1.0,
      saturation: 1.2,
      sharpen: true,
      ditheringMethod: 'floyd-steinberg',
      preserveColors: false,
    },
    cartoon: {
      name: '卡通动漫',
      description: '鲜艳色彩，清晰线条',
      gridSize: { width: 40, height: 40 },
      colorCount: 14,
      contrast: 1.4,
      brightness: 1.0,
      saturation: 1.3,
      sharpen: true,
      ditheringMethod: 'floyd-steinberg',
      preserveColors: false,
    },
    pixel: {
      name: '像素艺术',
      description: '精确颜色，锐利边缘',
      gridSize: { width: 25, height: 25 },
      colorCount: 16,
      contrast: 1.0,
      brightness: 1.0,
      saturation: 1.0,
      sharpen: false,
      ditheringMethod: 'none',
      preserveColors: true,
    },
    logo: {
      name: 'Logo设计',
      description: '精确颜色，无抖动',
      gridSize: { width: 30, height: 30 },
      colorCount: 12,
      contrast: 1.0,
      brightness: 1.0,
      saturation: 1.0,
      sharpen: false,
      ditheringMethod: 'none',
      preserveColors: true,
    },
    default: {
      name: '通用推荐',
      description: '平衡的参数配置',
      gridSize: { width: 35, height: 35 },
      colorCount: 16,
      contrast: 1.2,
      brightness: 1.0,
      saturation: 1.1,
      sharpen: true,
      ditheringMethod: 'floyd-steinberg',
      preserveColors: false,
    },
  };

  const applyPreset = (presetKey: string) => {
    const preset = presets[presetKey];
    if (!preset) return;

    setGridSize(preset.gridSize);
    setColorCount(preset.colorCount);
    setContrast(preset.contrast);
    setBrightness(preset.brightness);
    setSaturation(preset.saturation);
    setSharpen(preset.sharpen);
    setDitheringMethod(preset.ditheringMethod);
    setUseDithering(preset.ditheringMethod !== 'none');
    setPreserveColors(preset.preserveColors);

    message.success(`已应用预设：${preset.name} - ${preset.description}`);
  };

  // 初始化色板
  useState(() => {
    if (selectedPalette.length === 0) {
      setSelectedPalette(getPalette(brand));
    }
  });

  const handleImageLoad = async (image: HTMLImageElement) => {
    setOriginalImage(image);
    setGridData(null); // 清空之前的网格数据
    setProgress(null);
    
    // 分析图像并推荐参数
    try {
      const recommended = await analyzeImageAndRecommend(image);
      setRecommendation(recommended);
      message.success(`${recommended.reason} - 可使用智能推荐参数`);
    } catch (error) {
      console.error('分析图像失败:', error);
    }
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
    setProgress({ stage: 'resize', progress: 0, message: '正在调整图片尺寸...' });
    
    // 创建取消令牌
    const token = new CancellationToken();
    setCancellationToken(token);
    
    try {
      // 1. 调整图片尺寸
      setProgress({ stage: 'resize', progress: 0, message: '正在调整图片尺寸...' });
      let imageData = await resizeImage(originalImage, gridSize.width, gridSize.height, preserveColors);

      // 2. 图像预处理
      setProgress({ stage: 'preprocess', progress: 0, message: preserveColors ? '精确颜色模式：跳过预处理...' : '正在预处理图像...' });
      const processOptions: ImageProcessOptions = {
        contrast,
        brightness,
        saturation,
        sharpen,
        sharpenAmount: 0.5,
        preserveColors,
      };
      imageData = preprocessImage(imageData, processOptions);

      // 3. 颜色量化
      setProgress({ stage: 'quantize', progress: 0, message: '正在分析颜色...' });
      const usedColors = quantizeColors(imageData, availableColors, colorCount);

      // 4. 生成网格（使用选择的抖动算法）
      const method = useDithering ? ditheringMethod : 'none';
      const grid = imageToGrid(
        imageData, 
        usedColors, 
        gridSize.width, 
        gridSize.height, 
        method,
        setProgress,
        token
      );

      setProgress({ stage: 'complete', progress: 100, message: '转换完成！' });
      setGridData(grid);
      setPreviewMode(false);
      setProcessedImageData(imageData); // 保存处理后的图像数据
      
      // 分析颜色匹配质量
      const quality = analyzeColorMatchQuality(imageData, grid);
      setMatchQuality(quality);
      
      // 显示质量报告
      const excellentPercent = (quality.excellentMatches / quality.totalPixels * 100).toFixed(1);
      const goodPercent = (quality.goodMatches / quality.totalPixels * 100).toFixed(1);
      message.success(`转换成功！颜色匹配质量：${excellentPercent}% 优秀，${goodPercent}% 良好`);
      
      console.log('颜色匹配质量报告:', {
        平均色差: quality.averageDeltaE.toFixed(2),
        最大色差: quality.maxDeltaE.toFixed(2),
        优秀匹配百分比: excellentPercent + '%',
        良好匹配百分比: goodPercent + '%',
      });
    } catch (error: any) {
      console.error('转换失败:', error);
      if (error.message === '操作已取消') {
        message.info('操作已取消');
      } else {
        message.error('转换失败，请重试');
      }
    } finally {
      setProcessing(false);
      setCancellationToken(null);
      setTimeout(() => setProgress(null), 2000);
    }
  };

  const handleCancel = () => {
    if (cancellationToken) {
      cancellationToken.cancel();
      message.info('正在取消...');
    }
  };

  const applyRecommendation = () => {
    if (!recommendation) return;

    setGridSize(recommendation.gridSize);
    setColorCount(recommendation.colorCount);
    setContrast(recommendation.contrast);
    setBrightness(recommendation.brightness);
    setSaturation(recommendation.saturation);
    setSharpen(recommendation.sharpen);
    setDitheringMethod(recommendation.ditheringMethod);
    setUseDithering(recommendation.ditheringMethod !== 'none');
    
    message.success(`已应用智能推荐：${recommendation.reason}`);
  };

  // 根据质量报告生成智能优化建议
  const getQualityOptimizationSuggestions = (quality: ColorMatchQuality): string[] => {
    const suggestions: string[] = [];
    const avgDelta = quality.averageDeltaE;
    const poorPercent = (quality.poorMatches / quality.totalPixels) * 100;
    const excellentPercent = (quality.excellentMatches / quality.totalPixels) * 100;

    if (avgDelta > 10) {
      suggestions.push('💡 平均色差较大，建议增加颜色数量到24-32种');
      suggestions.push('💡 尝试启用"精确颜色模式"以保持原始颜色');
      suggestions.push('💡 尝试切换到另一个拼豆品牌');
    } else if (avgDelta > 5) {
      suggestions.push('💡 建议增加颜色数量到20-24种');
      if (!preserveColors) {
        suggestions.push('💡 可以尝试启用"精确颜色模式"');
      }
    }

    if (poorPercent > 20) {
      suggestions.push('⚠️ 超过20%的像素匹配较差，强烈建议增加可用颜色');
    }

    if (excellentPercent < 20 && !preserveColors) {
      suggestions.push('💡 启用"精确颜色模式"可能会改善匹配质量');
    }

    if (preserveColors && avgDelta > 5) {
      suggestions.push('💡 当前为精确颜色模式，建议增加颜色数量或检查色板');
    }

    if (!preserveColors && avgDelta < 3) {
      suggestions.push('✨ 匹配质量已经很好！可以尝试调整预处理参数优化视觉效果');
    }

    if (suggestions.length === 0) {
      suggestions.push('✅ 颜色匹配质量优秀，无需调整');
    }

    return suggestions;
  };

  // 一键自动优化
  const applyAutoOptimization = () => {
    if (!matchQuality) return;

    const avgDelta = matchQuality.averageDeltaE;
    const poorPercent = (matchQuality.poorMatches / matchQuality.totalPixels) * 100;
    
    let optimized = false;

    // 根据质量自动调整参数
    if (avgDelta > 10 || poorPercent > 20) {
      // 质量很差：启用精确颜色模式 + 增加颜色数量
      setPreserveColors(true);
      setColorCount(Math.min(32, colorCount + 8));
      setUseDithering(false);
      setDitheringMethod('none');
      message.success('已启用精确颜色模式并增加颜色数量');
      optimized = true;
    } else if (avgDelta > 5) {
      // 质量一般：增加颜色数量
      setColorCount(Math.min(24, colorCount + 4));
      message.success('已增加颜色数量到 ' + Math.min(24, colorCount + 4));
      optimized = true;
    } else if (avgDelta > 3) {
      // 质量良好：微调
      if (!preserveColors) {
        setPreserveColors(true);
        message.success('已启用精确颜色模式');
        optimized = true;
      } else {
        setColorCount(Math.min(20, colorCount + 2));
        message.success('已增加颜色数量到 ' + Math.min(20, colorCount + 2));
        optimized = true;
      }
    }

    if (!optimized) {
      message.info('当前质量已经很好，无需优化！');
    } else {
      message.info('请点击"完整转换"应用优化效果', 3);
    }
  };

  // 导出质量报告
  const exportQualityReport = () => {
    if (!matchQuality) return;

    const report = {
      timestamp: new Date().toISOString(),
      imageSize: {
        width: gridSize.width,
        height: gridSize.height,
      },
      settings: {
        brand,
        colorCount,
        preserveColors,
        contrast,
        brightness,
        saturation,
        sharpen,
        ditheringMethod,
        useDithering,
      },
      quality: {
        averageDeltaE: matchQuality.averageDeltaE.toFixed(2),
        maxDeltaE: matchQuality.maxDeltaE.toFixed(2),
        minDeltaE: matchQuality.minDeltaE.toFixed(2),
        excellentMatches: {
          count: matchQuality.excellentMatches,
          percentage: ((matchQuality.excellentMatches / matchQuality.totalPixels) * 100).toFixed(2) + '%',
        },
        goodMatches: {
          count: matchQuality.goodMatches,
          percentage: ((matchQuality.goodMatches / matchQuality.totalPixels) * 100).toFixed(2) + '%',
        },
        fairMatches: {
          count: matchQuality.fairMatches,
          percentage: ((matchQuality.fairMatches / matchQuality.totalPixels) * 100).toFixed(2) + '%',
        },
        poorMatches: {
          count: matchQuality.poorMatches,
          percentage: ((matchQuality.poorMatches / matchQuality.totalPixels) * 100).toFixed(2) + '%',
        },
        totalPixels: matchQuality.totalPixels,
      },
      suggestions: getQualityOptimizationSuggestions(matchQuality),
    };

    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pingdou_quality_report_${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    message.success('质量报告已导出');
  };

  // 快速预览
  const handleQuickPreview = async () => {
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
    setPreviewMode(true);
    
    try {
      message.info('正在生成快速预览（15×15）...');
      
      const preview = await generateQuickPreview(
        originalImage,
        availableColors,
        {
          contrast,
          brightness,
          saturation,
          sharpen,
          ditheringMethod,
        },
        15
      );

      setGridData(preview);
      message.success('快速预览完成！可调整参数后转换完整图像');
    } catch (error) {
      console.error('预览失败:', error);
      message.error('预览失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter: 开始转换
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !processing && originalImage) {
        e.preventDefault();
        handleConvert();
      }
      // Ctrl/Cmd + P: 快速预览
      if ((e.ctrlKey || e.metaKey) && e.key === 'p' && !processing && originalImage) {
        e.preventDefault();
        handleQuickPreview();
      }
      // Escape: 取消处理
      if (e.key === 'Escape' && processing && cancellationToken) {
        e.preventDefault();
        handleCancel();
      }
      // Ctrl/Cmd + D: 切换对比视图
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && gridData && originalImage) {
        e.preventDefault();
        setShowComparison(!showComparison);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [processing, originalImage, gridData, cancellationToken, showComparison]);


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

              {/* 智能推荐 */}
              {recommendation && (
                <Card title="💡 智能推荐" size="small">
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">{recommendation.reason}</div>
                    <Button 
                      type="primary" 
                      block 
                      onClick={applyRecommendation}
                      disabled={processing}
                    >
                      应用智能推荐
                    </Button>
                  </div>
                </Card>
              )}

              {/* 参数预设 */}
              <Card title="快速预设" size="small">
                <Select
                  placeholder="选择预设模板"
                  className="w-full"
                  allowClear
                  onChange={(value) => value && applyPreset(value)}
                  options={[
                    { 
                      label: '🎯 通用推荐', 
                      value: 'default',
                      title: presets.default.description
                    },
                    { 
                      label: '👤 人像照片', 
                      value: 'portrait',
                      title: presets.portrait.description
                    },
                    { 
                      label: '🏞️ 风景照片', 
                      value: 'landscape',
                      title: presets.landscape.description
                    },
                    { 
                      label: '🎨 卡通动漫', 
                      value: 'cartoon',
                      title: presets.cartoon.description
                    },
                    { 
                      label: '🎮 像素艺术', 
                      value: 'pixel',
                      title: presets.pixel.description
                    },
                    { 
                      label: '🏷️ Logo设计', 
                      value: 'logo',
                      title: presets.logo.description
                    },
                  ]}
                />
                <div className="text-xs text-gray-500 mt-2">
                  💡 预设会自动调整所有参数以适应不同类型的图像
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

              {/* 图像调整 */}
              <Card title="图像调整" size="small">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pt-1 pb-2 border-b">
                    <span className="text-sm font-medium">🎯 精确颜色模式</span>
                    <Switch 
                      checked={preserveColors} 
                      onChange={(checked) => {
                        setPreserveColors(checked);
                        if (checked) {
                          message.info('已启用精确颜色模式，将跳过所有预处理');
                        }
                      }} 
                    />
                  </div>
                  {!preserveColors && (
                    <>
                      <div>
                        <label className="block text-sm mb-1">对比度: {contrast.toFixed(1)}</label>
                        <Slider
                          min={0.5}
                          max={2.0}
                          step={0.1}
                          value={contrast}
                          onChange={setContrast}
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">亮度: {brightness.toFixed(1)}</label>
                        <Slider
                          min={0.5}
                          max={2.0}
                          step={0.1}
                          value={brightness}
                          onChange={setBrightness}
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">饱和度: {saturation.toFixed(1)}</label>
                        <Slider
                          min={0.5}
                          max={2.0}
                          step={0.1}
                          value={saturation}
                          onChange={setSaturation}
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-sm">锐化处理</span>
                        <Switch checked={sharpen} onChange={setSharpen} />
                      </div>
                    </>
                  )}
                  {preserveColors && (
                    <div className="text-xs text-gray-500 py-2">
                      精确颜色模式下，所有预处理都将被禁用，以保持原始颜色的准确性。适合像素艺术和对颜色要求严格的图片。
                    </div>
                  )}
                </div>
              </Card>

              {/* 抖动算法 */}
              <Card title="抖动算法" size="small">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">启用抖动</span>
                    <Switch checked={useDithering} onChange={setUseDithering} />
                  </div>
                  {useDithering && (
                    <Select
                      value={ditheringMethod}
                      onChange={setDitheringMethod}
                      className="w-full"
                      options={[
                        { label: 'Floyd-Steinberg（推荐）', value: 'floyd-steinberg' },
                        { label: 'Atkinson（柔和）', value: 'atkinson' },
                        { label: 'Jarvis（详细）', value: 'jarvis' },
                        { label: 'Stucki（平衡）', value: 'stucki' },
                      ]}
                    />
                  )}
                </div>
              </Card>

              {/* 操作按钮 */}
              <Card title="操作" size="small">
                <Space direction="vertical" className="w-full">
                  {progress && (
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">{progress.message}</span>
                        <span className="font-medium">{progress.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      block
                      onClick={handleQuickPreview}
                      disabled={!originalImage || processing}
                      title="Ctrl/Cmd + P"
                    >
                      快速预览
                    </Button>
                    <Button
                      type="primary"
                      block
                      size="large"
                      loading={processing}
                      onClick={handleConvert}
                      disabled={!originalImage}
                      title="Ctrl/Cmd + Enter"
                    >
                      {processing ? '处理中...' : '完整转换'}
                    </Button>
                  </div>
                  {previewMode && gridData && (
                    <div className="text-xs text-orange-600 text-center">
                      ⚠️ 当前为预览模式（15×15），请点击"完整转换"生成最终图纸
                    </div>
                  )}
                  {processing && (
                    <Button
                      danger
                      block
                      onClick={handleCancel}
                      title="Esc"
                    >
                      取消处理 (Esc)
                    </Button>
                  )}
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
            <Card 
              title={showColorComparison ? "📊 颜色对比分析" : "图纸预览"}
              extra={
                originalImage && gridData && (
                  <Space>
                    {showColorComparison && (
                      <span className="text-xs text-gray-500">
                        左：原图 | 右：拼豆效果
                      </span>
                    )}
                    <Switch
                      checkedChildren="对比"
                      unCheckedChildren="预览"
                      checked={showComparison}
                      onChange={setShowComparison}
                    />
                  </Space>
                )
              }
            >
              {showComparison && originalImage && gridData ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-2 text-gray-600">原图</div>
                    <div className="border rounded overflow-hidden bg-white">
                      <img
                        src={originalImage.src}
                        alt="原图"
                        className="w-full h-auto"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2 text-gray-600">转换后</div>
                    <GridCanvas gridData={gridData} showGrid={showGrid} cellSize={15} />
                  </div>
                </div>
              ) : (
                <GridCanvas gridData={gridData} showGrid={showGrid} cellSize={15} />
              )}
            </Card>
          </Col>

          {/* 右侧色板和材料清单 */}
          <Col xs={24} lg={6}>
            <Space direction="vertical" className="w-full" size="middle">
              <ColorPalette
                palette={selectedPalette}
                onPaletteChange={setSelectedPalette}
              />
              
              {/* 颜色匹配质量报告 */}
              {matchQuality && gridData && (
                <Card 
                  title="📊 颜色匹配质量"
                  size="small"
                  extra={
                    <Space size="small">
                      <Button 
                        size="small" 
                        type="link"
                        icon={<DownloadOutlined />}
                        onClick={exportQualityReport}
                        title="导出质量报告"
                      />
                      <Button 
                        size="small" 
                        type="link"
                        onClick={() => setShowColorComparison(!showColorComparison)}
                      >
                        {showColorComparison ? '隐藏对比' : '查看对比'}
                      </Button>
                    </Space>
                  }
                >
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">平均色差 (ΔE):</span>
                      <span className={`font-medium ${
                        matchQuality.averageDeltaE < 5 ? 'text-green-600' :
                        matchQuality.averageDeltaE < 10 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {matchQuality.averageDeltaE.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">最大色差:</span>
                      <span className="font-medium">
                        {matchQuality.maxDeltaE.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t pt-2 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-green-600">✓ 优秀 (ΔE &lt; 2):</span>
                        <span className="font-medium">
                          {((matchQuality.excellentMatches / matchQuality.totalPixels) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-600">✓ 良好 (ΔE &lt; 5):</span>
                        <span className="font-medium">
                          {((matchQuality.goodMatches / matchQuality.totalPixels) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-yellow-600">○ 一般 (ΔE &lt; 10):</span>
                        <span className="font-medium">
                          {((matchQuality.fairMatches / matchQuality.totalPixels) * 100).toFixed(1)}%
                        </span>
                      </div>
                      {matchQuality.poorMatches > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-red-600">✗ 较差 (ΔE ≥ 10):</span>
                          <span className="font-medium">
                            {((matchQuality.poorMatches / matchQuality.totalPixels) * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* 智能优化建议 */}
                    <div className="border-t pt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium text-gray-700">💡 优化建议</div>
                        {matchQuality.averageDeltaE > 3 && (
                          <Button 
                            size="small" 
                            type="primary"
                            onClick={applyAutoOptimization}
                          >
                            一键优化
                          </Button>
                        )}
                      </div>
                      <div className="space-y-1">
                        {getQualityOptimizationSuggestions(matchQuality).map((suggestion, idx) => (
                          <div key={idx} className="text-xs text-gray-600">
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 颜色对比画布 */}
                    {showColorComparison && processedImageData && (
                      <div className="border-t pt-3">
                        <div className="text-xs font-medium text-gray-700 mb-2">🎨 像素级颜色对比：</div>
                        <ColorComparisonCanvas
                          originalImageData={processedImageData}
                          gridData={gridData}
                          scale={8}
                        />
                        <div className="text-xs text-gray-500 mt-2">
                          左侧为原始颜色，右侧为匹配的拼豆颜色。可以清晰看到每个像素的颜色差异。
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}
              
              {gridData && <MaterialList gridData={gridData} />}
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default WorkspacePage;
