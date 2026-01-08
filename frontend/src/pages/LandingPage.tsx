import { useNavigate } from 'react-router-dom';
import { Button, Card, Row, Col, Typography } from 'antd';
import { CheckCircleOutlined, RocketOutlined, SafetyOutlined, ThunderboltOutlined } from '@ant-design/icons';
import Header from '../components/common/Header';
import { useAppStore } from '../store/useAppStore';

const { Title, Paragraph } = Typography;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, activation } = useAppStore();

  const features = [
    {
      icon: <ThunderboltOutlined style={{ fontSize: '32px', color: '#1890ff' }} />,
      title: '快速转换',
      description: '上传图片，一键转换为拼豆图纸，支持多种颜色配置'
    },
    {
      icon: <CheckCircleOutlined style={{ fontSize: '32px', color: '#52c41a' }} />,
      title: '精准配色',
      description: '采用CIEDE2000算法，精准匹配Perler、Hama等品牌色板'
    },
    {
      icon: <RocketOutlined style={{ fontSize: '32px', color: '#722ed1' }} />,
      title: '高效导出',
      description: '支持PNG、PDF导出，自动生成材料清单，方便采购'
    },
    {
      icon: <SafetyOutlined style={{ fontSize: '32px', color: '#fa8c16' }} />,
      title: '云端保存',
      description: '作品云端保存，随时随地访问您的创作'
    }
  ];

  const handleGetStarted = () => {
    if (isAuthenticated && activation) {
      navigate('/workspace');
    } else if (isAuthenticated) {
      navigate('/activate');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Title level={1} className="!text-white !text-5xl !mb-6">
            将照片变成拼豆作品
          </Title>
          <Paragraph className="!text-white !text-xl !mb-8 max-w-2xl mx-auto">
            专业的拼豆图纸转换工具，支持多品牌色板，精准配色，一键导出
          </Paragraph>
          <Button
            type="primary"
            size="large"
            onClick={handleGetStarted}
            className="!h-12 !px-8 !text-lg"
          >
            {isAuthenticated && activation ? '进入工作台' : '立即开始'}
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <Title level={2}>核心功能</Title>
          <Paragraph className="text-gray-600 text-lg">
            强大的功能，让创作更简单
          </Paragraph>
        </div>

        <Row gutter={[24, 24]}>
          {features.map((feature, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card hoverable className="text-center h-full">
                <div className="mb-4">{feature.icon}</div>
                <Title level={4}>{feature.title}</Title>
                <Paragraph className="text-gray-600">
                  {feature.description}
                </Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Title level={2} className="!text-white !mb-4">
            准备好开始创作了吗？
          </Title>
          <Paragraph className="!text-white !text-lg !mb-8">
            立即注册，开启您的拼豆创作之旅
          </Paragraph>
          <Button
            type="default"
            size="large"
            onClick={handleGetStarted}
            className="!h-12 !px-8 !text-lg"
          >
            免费开始
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Paragraph className="!text-gray-400 !mb-0">
            © 2026 拼豆图纸转换工具. All rights reserved.
          </Paragraph>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
