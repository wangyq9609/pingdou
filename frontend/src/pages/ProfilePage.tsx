import { Card, Descriptions, Typography, Button, Space } from 'antd';
import { UserOutlined, MailOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import { useAppStore } from '../store/useAppStore';

const { Title } = Typography;

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, activation } = useAppStore();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Title level={2} className="!mb-6">个人资料</Title>

        <Card className="mb-6">
          <Descriptions title="基本信息" column={1}>
            <Descriptions.Item label={<><UserOutlined /> 用户名</>}>
              {user.username}
            </Descriptions.Item>
            <Descriptions.Item label={<><MailOutlined /> 邮箱</>}>
              {user.email}
            </Descriptions.Item>
            <Descriptions.Item label="角色">
              {user.role === 'admin' ? '管理员' : '普通用户'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {activation && (
          <Card className="mb-6">
            <Descriptions title="激活信息" column={1}>
              <Descriptions.Item label="套餐类型">
                {activation.codeTypeName}
              </Descriptions.Item>
              <Descriptions.Item label={<><CalendarOutlined /> 到期时间</>}>
                {new Date(activation.expiresAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="剩余天数">
                {activation.daysLeft} 天
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        <Card>
          <Space>
            <Button type="primary" onClick={() => navigate('/activate')}>
              激活管理
            </Button>
            <Button onClick={() => navigate('/workspace')}>
              进入工作台
            </Button>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
