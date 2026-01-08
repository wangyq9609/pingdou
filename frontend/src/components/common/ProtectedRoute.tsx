import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAppStore } from '../../store/useAppStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireActivation?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireActivation = false }) => {
  const { isAuthenticated, isLoading, activation } = useAppStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireActivation && !activation) {
    return <Navigate to="/activate" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
