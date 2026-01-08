import { Card, Table, Typography, Tag } from 'antd';
import { GridCell } from '../../types';
import { calculateColorStats } from '../../utils/imageProcessor';

const { Title } = Typography;

interface MaterialListProps {
  gridData: GridCell[][] | null;
}

const MaterialList: React.FC<MaterialListProps> = ({ gridData }) => {
  if (!gridData) {
    return null;
  }

  const stats = calculateColorStats(gridData);
  const statsArray = Array.from(stats.values()).sort((a, b) => b.count - a.count);

  const totalBeads = statsArray.reduce((sum, item) => sum + item.count, 0);

  const columns = [
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      render: (_: any, record: any) => (
        <div className="flex items-center space-x-2">
          <div
            className="w-8 h-8 rounded border"
            style={{ backgroundColor: record.color.hex }}
          />
          <span>{record.color.name}</span>
        </div>
      ),
    },
    {
      title: '品牌',
      dataIndex: 'brand',
      key: 'brand',
      render: (_: any, record: any) => <Tag>{record.color.brand}</Tag>,
    },
    {
      title: '编号',
      dataIndex: 'id',
      key: 'id',
      render: (_: any, record: any) => <code>{record.color.id}</code>,
    },
    {
      title: '数量',
      dataIndex: 'count',
      key: 'count',
      render: (count: number) => <strong>{count}</strong>,
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (_: any, record: any) => {
        const percentage = ((record.count / totalBeads) * 100).toFixed(1);
        return `${percentage}%`;
      },
    },
  ];

  return (
    <Card>
      <Title level={4} className="!mb-4">
        材料清单
      </Title>
      <div className="mb-4">
        <Tag color="blue">总计: {totalBeads} 颗</Tag>
        <Tag color="green">颜色数: {statsArray.length} 种</Tag>
      </div>
      <Table
        dataSource={statsArray}
        columns={columns}
        rowKey={(record) => record.color.id}
        pagination={false}
        size="small"
      />
    </Card>
  );
};

export default MaterialList;
