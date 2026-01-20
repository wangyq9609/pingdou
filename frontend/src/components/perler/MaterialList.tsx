import React from 'react';
import { MaterialItem } from '../../utils/imageProcessor';
import type { BrandType } from './PerlerGenerator';

interface MaterialListProps {
  materials: MaterialItem[];
  totalPixels: number;
  selectedBrand: BrandType;
}

const MaterialList: React.FC<MaterialListProps> = ({ materials, totalPixels, selectedBrand }) => {

  if (materials.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        暂无材料清单
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-gray-700 mb-3">
        材料清单 (共 {totalPixels} 颗)
      </div>
      <div className="max-h-96 overflow-y-auto space-y-2">
        {materials.map((item) => {
          const percentage = ((item.count / totalPixels) * 100).toFixed(1);
          const displayCode = selectedBrand !== 'none' && item.color.brandCodes?.[selectedBrand]
            ? item.color.brandCodes[selectedBrand]
            : null;

          return (
            <div
              key={item.color.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-8 h-8 rounded border border-gray-300 shadow-sm"
                  style={{ backgroundColor: item.color.hex }}
                  title={item.color.name}
                />
                <div className="flex-1">
                  {displayCode ? (
                    <div className="text-sm font-medium text-gray-800">
                      {displayCode}
                    </div>
                  ) : (
                    <>
                      <div className="text-sm font-medium text-gray-800">
                        {item.color.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.color.nameEn}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-800">
                  {item.count} 颗
                </div>
                <div className="text-xs text-gray-500">
                  {percentage}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MaterialList;
