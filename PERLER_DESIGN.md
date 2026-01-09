# 拼豆像素图生成器 - 设计文档

## 项目概述

拼豆像素图生成器是一个将普通图片转换为适合拼豆（Perler Beads）制作的像素图案的 Web 工具。用户可以上传图片，系统会自动进行像素化处理、颜色匹配和量化，生成拼豆图案和材料清单。

## 核心功能设计

### 1. 图片上传与处理
- **功能**: 支持常见图片格式上传（JPG, PNG, GIF, WebP 等）
- **实现**: 使用 HTML5 File API 和 Canvas API
- **技术**: `loadImageToImageData()` 函数将图片转换为 ImageData 格式

### 2. 图片像素化处理
- **降采样 (Downsampling)**
  - 将原图缩小到目标像素尺寸（如 50x50, 100x100）
  - 使用高质量缩放算法保持图像质量
  - 可调节像素尺寸（20-200 像素）

- **颜色量化 (Color Quantization)**
  - 将图片中的颜色映射到拼豆标准颜色调色板
  - 使用 CIEDE2000 色差算法进行精确颜色匹配
  - 支持抖动算法（Floyd-Steinberg）改善渐变效果

### 3. 颜色匹配算法
- **CIEDE2000 色差算法**
  - 最先进的人眼感知色差计算
  - 考虑亮度、色度、色调三个维度
  - 比简单的欧氏距离更准确

- **颜色调色板**
  - 基于 Perler Beads 官方标准颜色
  - 包含 30+ 种常用颜色
  - 每种颜色包含 RGB、HEX、中英文名称

### 4. 图像增强
- **亮度调整**: -100 到 +100
- **对比度调整**: -100 到 +100
- **实时预览**: 调整后立即看到效果

### 5. 可视化展示
- **像素网格渲染**
  - 使用 Konva.js 进行高性能 Canvas 渲染
  - 支持网格线显示/隐藏
  - 可调节显示尺寸（5-50px）
  - 点击像素查看颜色信息

### 6. 材料清单生成
- **自动统计**: 统计每种颜色使用的数量
- **百分比计算**: 显示每种颜色的使用比例
- **排序**: 按使用数量降序排列
- **导出**: 支持导出为文本文件

### 7. 导出功能
- **图案导出**: PNG 格式，高分辨率
- **材料清单导出**: TXT 格式，包含详细信息
- **未来扩展**: 可支持 PDF、SVG 等格式

## 技术架构

### 前端技术栈
- **React 18** + **TypeScript**: 组件化开发
- **Vite**: 快速构建工具
- **Konva.js** + **react-konva**: Canvas 渲染
- **Ant Design**: UI 组件库
- **Tailwind CSS**: 样式框架

### 核心模块

#### 1. 颜色处理模块 (`colorConverter.ts`)
- RGB ↔ LAB 颜色空间转换
- CIEDE2000 色差计算
- RGB ↔ HEX 转换

#### 2. 拼豆颜色调色板 (`perlerColors.ts`)
- 标准颜色定义
- 颜色查找和匹配工具函数

#### 3. 图片处理模块 (`imageProcessor.ts`)
- 图片加载和转换
- 降采样算法
- 颜色量化
- 抖动算法
- 亮度和对比度调整

#### 4. UI 组件
- **PerlerGenerator**: 主生成器组件
- **PixelGrid**: 像素网格可视化
- **MaterialList**: 材料清单展示

## 算法详解

### 1. 降采样算法
```typescript
// 使用 Canvas 的高质量缩放
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';
ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
```

### 2. 颜色匹配算法
```typescript
// 对每个像素，计算与调色板中所有颜色的 CIEDE2000 色差
// 选择色差最小的颜色作为匹配结果
function findClosestPerlerColor(rgb: RGB, palette: PerlerColor[]): PerlerColor {
  const lab = rgbToLab(rgb);
  let minDeltaE = Infinity;
  let closestColor = palette[0];
  
  for (const color of palette) {
    const colorLab = rgbToLab(color.rgb);
    const deltaE = deltaE2000(lab, colorLab);
    if (deltaE < minDeltaE) {
      minDeltaE = deltaE;
      closestColor = color;
    }
  }
  return closestColor;
}
```

### 3. Floyd-Steinberg 抖动算法
- 将量化误差扩散到相邻像素
- 改善渐变区域的视觉效果
- 误差分配比例: 右(7/16), 左下(3/16), 下(5/16), 右下(1/16)

## 性能优化

### 1. 图片处理优化
- 使用 Web Workers（未来扩展）处理大图片
- 渐进式处理，显示处理进度
- 缓存处理结果

### 2. 渲染优化
- Konva.js 使用 WebGL 加速
- 虚拟滚动（如果像素数量很大）
- 按需渲染

### 3. 内存管理
- 及时释放图片 URL
- 清理 Canvas 资源
- 限制最大图片尺寸

## 用户体验设计

### 1. 交互流程
1. 用户上传图片
2. 调整参数（像素尺寸、亮度、对比度等）
3. 点击"生成拼豆图"
4. 查看预览和材料清单
5. 导出结果

### 2. 参数说明
- **像素尺寸**: 控制图案精细程度，数值越大越精细但处理时间更长
- **亮度**: 调整整体明暗
- **对比度**: 调整颜色对比强度
- **颜色抖动**: 改善渐变效果，但处理时间更长
- **显示尺寸**: 仅影响预览，不影响导出

### 3. 反馈机制
- 处理中显示加载状态
- 成功/失败消息提示
- 实时参数预览

## 未来扩展

### 1. 功能扩展
- [ ] 支持批量处理
- [ ] 自定义颜色调色板
- [ ] 图案编辑功能（手动调整颜色）
- [ ] 3D 预览效果
- [ ] 拼豆板尺寸计算
- [ ] 多格式导出（PDF, SVG, Excel）

### 2. 算法优化
- [ ] 支持更多抖动算法（Ordered, Atkinson）
- [ ] 自适应颜色调色板选择
- [ ] 智能边缘检测和优化
- [ ] 支持透明背景处理

### 3. 用户体验
- [ ] 处理历史记录
- [ ] 收藏常用设置
- [ ] 分享功能
- [ ] 移动端适配

## 使用示例

```typescript
// 基本使用
const result = await processImageToPerler(file, {
  pixelSize: 50,
  colorPalette: getAvailableColors(),
  dithering: false,
  brightness: 0,
  contrast: 0,
});

// 生成材料清单
const materials = generateMaterialList(result, options.colorPalette);
```

## 技术要点

### 为什么选择 CIEDE2000？
- 最准确的人眼感知色差计算
- 考虑亮度、色度、色调三个维度
- 比简单的 RGB 欧氏距离准确 3-5 倍

### 为什么使用 Konva.js？
- 高性能 Canvas 渲染
- 支持 WebGL 加速
- React 友好的 API
- 丰富的图形操作功能

### 为什么使用 LAB 颜色空间？
- 感知均匀的颜色空间
- 适合颜色匹配和色差计算
- CIEDE2000 算法的基础

## 总结

拼豆像素图生成器通过先进的图像处理算法和用户友好的界面，将普通图片转换为高质量的拼豆图案。核心优势包括：

1. **精确的颜色匹配**: CIEDE2000 算法确保最佳颜色还原
2. **灵活的调整选项**: 多种参数满足不同需求
3. **完整的工具链**: 从上传到导出一站式服务
4. **高性能处理**: 优化的算法和渲染确保流畅体验
