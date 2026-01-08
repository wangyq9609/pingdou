import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Button, Typography, message, Tag, List, Empty } from 'antd';
import { GiftOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import Header from '../components/common/Header';
import { useAppStore } from '../store/useAppStore';
import { redemptionService } from '../services/redemptionService';
import type { Activation } from '../types';

const { Title, Text, Paragraph } = Typography;

const ActivationPage: React.FC = () => {
  const navigate = useNavigate();
  const { activation, setActivation } = useAppStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [activations, setActivations] = useState<Activation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    loadActivations();
  }, []);

  const loadActivations = async () => {
    try {
      const result = await redemptionService.getMyActivations();
      setActivations(result.activations);
    } catch (error) {
      message.error('加载激活记录失败');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRedeem = async () => {
    if (!code.trim()) {
      message.warning('请输入兑换码');
      return;
    }

    setLoading(true);
    try {
      const result = await redemptionService.redeem(code);
      message.success('兑换成功！');
      setActivation(result.activation);
      setCode('');
      loadActivations();
      
      // 跳转到工作台
      setTimeout(() => {
        navigate('/workspace');
      }, 1500);
    } catch (error: any) {
      message.error(error?.error?.message || '兑换失败');
    } finally {
      setLoading(false);
    }
  };

  const formatCode = (value: string) => {
    // 移除非法字符
    const cleaned = value.toUpperCase().replace(/[^23456789ABCDEFGHJKLMNPQRSTUVWXYZ-]/g, '');
    
    // 自动添加连字符
    const parts = cleaned.replace(/-/g, '').match(/.{1,4}/g) || [];
    return parts.join('-').substring(0, 19); // 最多4段，每段4个字符
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(formatCode(e.target.value));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 当前激活状态 */}
        {activation && (
          <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
                <div>
                  <Title level={4} className="!mb-1">当前激活：{activation.codeTypeName}</Title>
                  <Text type="secondary">
                    <ClockCircleOutlined /> 剩余 {activation.daysLeft} 天
                    （到期时间：{new Date(activation.expiresAt).toLocaleDateString()}）
                  </Text>
                </div>
              </div>
              <Button type="primary" onClick={() => navigate('/workspace')}>
                进入工作台
              </Button>
            </div>
          </Card>
        )}

        {/* 兑换区域 */}
        <Card className="mb-6">
          <div className="text-center mb-6">
            <GiftOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            <Title level={3} className="!mt-4 !mb-2">激活兑换码</Title>
            <Text type="secondary">输入您的兑换码以激活服务</Text>
          </div>

          <div className="max-w-md mx-auto">
            <Input
              size="large"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={code}
              onChange={handleCodeChange}
              maxLength={19}
              className="text-center text-lg tracking-wider font-mono mb-4"
            />
            <Button
              type="primary"
              size="large"
              block
              loading={loading}
              onClick={handleRedeem}
              disabled={code.length !== 19}
            >
              立即兑换
            </Button>
          </div>
        </Card>

        {/* 激活历史 */}
        <Card title="激活历史" loading={loadingHistory}>
          {activations.length === 0 ? (
            <Empty description="暂无激活记录" />
          ) : (
            <List
              dataSource={activations}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <div className="flex items-center justify-between">
                        <span>{item.codeTypeName}</span>
                        <Tag color={item.isActive ? 'green' : 'default'}>
                          {item.isActive ? '激活中' : item.isExpired ? '已过期' : '已失效'}
                        </Tag>
                      </div>
                    }
                    description={
                      <div>
                        <div>兑换码：{item.code}</div>
                        <div>激活时间：{new Date(item.activatedAt).toLocaleString()}</div>
                        <div>到期时间：{new Date(item.expiresAt).toLocaleString()}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default ActivationPage;
