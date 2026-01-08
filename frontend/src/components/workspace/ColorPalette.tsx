import { Card, Select, Checkbox, Typography, Space } from 'antd';
import { BeadColor } from '../../types';

const { Title } = Typography;

interface ColorPaletteProps {
  palette: BeadColor[];
  onPaletteChange: (palette: BeadColor[]) => void;
}

const ColorPalette: React.FC<ColorPaletteProps> = ({ palette, onPaletteChange }) => {
  const toggleColor = (colorId: string) => {
    const updatedPalette = palette.map(color =>
      color.id === colorId ? { ...color, available: !color.available } : color
    );
    onPaletteChange(updatedPalette);
  };

  const toggleAll = (checked: boolean) => {
    const updatedPalette = palette.map(color => ({ ...color, available: checked }));
    onPaletteChange(updatedPalette);
  };

  const availableCount = palette.filter(c => c.available).length;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <Title level={5} className="!mb-0">
          颜色选择
        </Title>
        <Checkbox
          checked={availableCount === palette.length}
          indeterminate={availableCount > 0 && availableCount < palette.length}
          onChange={(e) => toggleAll(e.target.checked)}
        >
          全选 ({availableCount}/{palette.length})
        </Checkbox>
      </div>

      <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto">
        {palette.map((color) => (
          <div
            key={color.id}
            className={`cursor-pointer p-2 rounded border-2 transition-all ${
              color.available ? 'border-blue-500 shadow-sm' : 'border-gray-200 opacity-50'
            }`}
            onClick={() => toggleColor(color.id)}
          >
            <div
              className="w-full h-12 rounded mb-1"
              style={{ backgroundColor: color.hex }}
            />
            <div className="text-xs text-center">
              <div className="font-medium truncate" title={color.name}>
                {color.name.split(' ')[0]}
              </div>
              <code className="text-gray-500">{color.id}</code>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ColorPalette;
