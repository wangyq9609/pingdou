import { Link, useNavigate } from 'react-router-dom';
import { Button, Dropdown, Avatar, Space, Tag } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined, GiftOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAppStore } from '../../store/useAppStore';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, activation, logout } = useAppStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'activation',
      icon: <GiftOutlined />,
      label: '激活管理',
      onClick: () => navigate('/activate'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              拼豆工具
            </Link>
            
            {isAuthenticated && activation && (
              <nav className="flex space-x-4">
                <Link to="/workspace" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  工作台
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated && activation && (
              <Tag color="green">
                {activation.codeTypeName} - 剩余{activation.daysLeft}天
              </Tag>
            )}
            
            {isAuthenticated && user ? (
              <Dropdown menu={{ items: menuItems }} placement="bottomRight">
                <Space className="cursor-pointer">
                  <Avatar icon={<UserOutlined />} src={user.avatarUrl} />
                  <span className="text-sm font-medium">{user.username}</span>
                </Space>
              </Dropdown>
            ) : (
              <Space>
                <Button onClick={() => navigate('/login')}>登录</Button>
                <Button type="primary" onClick={() => navigate('/register')}>
                  注册
                </Button>
              </Space>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
