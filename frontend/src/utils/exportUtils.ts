import jsPDF from 'jspdf';
import { GridCell } from '../types';
import { calculateColorStats } from './imageProcessor';

// 导出为PNG
export async function exportToPNG(
  gridData: GridCell[][],
  cellSize: number = 20,
  showGrid: boolean = true
): Promise<void> {
  const canvas = document.createElement('canvas');
  const height = gridData.length;
  const width = gridData[0].length;
  
  canvas.width = width * cellSize;
  canvas.height = height * cellSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法创建Canvas上下文');
  }

  // 绘制颜色单元格
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = gridData[y][x];
      ctx.fillStyle = cell.color.hex;
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }

  // 绘制网格线
  if (showGrid) {
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;

    // 垂直线
    for (let x = 0; x <= width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, canvas.height);
      ctx.stroke();
    }

    // 水平线
    for (let y = 0; y <= height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(canvas.width, y * cellSize);
      ctx.stroke();
    }
  }

  // 下载
  canvas.toBlob((blob) => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bead-pattern-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
  });
}

// 导出为PDF（带材料清单）
export async function exportToPDF(
  gridData: GridCell[][],
  cellSize: number = 15
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;

  // 标题
  pdf.setFontSize(20);
  pdf.text('拼豆图纸', pageWidth / 2, margin + 10, { align: 'center' });

  // 生成网格图像
  const canvas = document.createElement('canvas');
  const height = gridData.length;
  const width = gridData[0].length;
  
  canvas.width = width * cellSize;
  canvas.height = height * cellSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法创建Canvas上下文');
  }

  // 绘制颜色单元格
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = gridData[y][x];
      ctx.fillStyle = cell.color.hex;
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }

  // 绘制网格线
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1;

  for (let x = 0; x <= width; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cellSize, 0);
    ctx.lineTo(x * cellSize, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * cellSize);
    ctx.lineTo(canvas.width, y * cellSize);
    ctx.stroke();
  }

  // 添加图纸图像到PDF
  const imgData = canvas.toDataURL('image/png');
  const imgWidth = pageWidth - 2 * margin;
  const imgHeight = (canvas.height / canvas.width) * imgWidth;

  let yPosition = margin + 20;

  if (imgHeight > pageHeight - yPosition - margin - 60) {
    // 图像太大，调整大小
    const scale = (pageHeight - yPosition - margin - 60) / imgHeight;
    pdf.addImage(
      imgData,
      'PNG',
      margin,
      yPosition,
      imgWidth * scale,
      imgHeight * scale
    );
    yPosition += imgHeight * scale + 10;
  } else {
    pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
    yPosition += imgHeight + 10;
  }

  // 添加材料清单
  const stats = calculateColorStats(gridData);
  const statsArray = Array.from(stats.values()).sort((a, b) => b.count - a.count);
  const totalBeads = statsArray.reduce((sum, item) => sum + item.count, 0);

  // 新页面添加材料清单
  if (yPosition > pageHeight - 80) {
    pdf.addPage();
    yPosition = margin;
  }

  pdf.setFontSize(16);
  pdf.text('材料清单', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.text(`尺寸: ${width} x ${height}`, margin, yPosition);
  yPosition += 5;
  pdf.text(`总计: ${totalBeads} 颗`, margin, yPosition);
  yPosition += 5;
  pdf.text(`颜色: ${statsArray.length} 种`, margin, yPosition);
  yPosition += 10;

  // 绘制表格
  pdf.setFontSize(9);
  const tableStartY = yPosition;
  const rowHeight = 7;
  const colWidths = [15, 60, 25, 25];

  // 表头
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, yPosition, colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], rowHeight, 'F');
  pdf.text('颜色', margin + 2, yPosition + 5);
  pdf.text('名称', margin + colWidths[0] + 2, yPosition + 5);
  pdf.text('编号', margin + colWidths[0] + colWidths[1] + 2, yPosition + 5);
  pdf.text('数量', margin + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPosition + 5);
  yPosition += rowHeight;

  // 数据行
  for (const item of statsArray) {
    if (yPosition > pageHeight - margin - rowHeight) {
      pdf.addPage();
      yPosition = margin;
    }

    // 颜色方块
    pdf.setFillColor(item.color.rgb.r, item.color.rgb.g, item.color.rgb.b);
    pdf.rect(margin + 2, yPosition + 1, 10, 5, 'F');

    // 文字
    pdf.setTextColor(0, 0, 0);
    pdf.text(item.color.name, margin + colWidths[0] + 2, yPosition + 5);
    pdf.text(item.color.id, margin + colWidths[0] + colWidths[1] + 2, yPosition + 5);
    pdf.text(item.count.toString(), margin + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPosition + 5);

    yPosition += rowHeight;
  }

  // 保存PDF
  pdf.save(`bead-pattern-${Date.now()}.pdf`);
}
