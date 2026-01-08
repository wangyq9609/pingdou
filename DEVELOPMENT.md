# 开发指南

本文档为开发者提供详细的开发环境设置和开发流程说明。

## 开发环境设置

### 必需软件
- Node.js 20+
- npm 或 yarn
- PostgreSQL 15+
- Redis 7+
- Git

### IDE推荐
- VS Code
  - 推荐扩展: 
    - ESLint
    - Prettier
    - Prisma
    - TypeScript Vue Plugin (Volar)

## 项目设置

### 1. 克隆项目

```bash
git clone <repository_url>
cd pingdou
```

### 2. 后端开发环境

```bash
cd backend

# 安装依赖
npm install

# 复制环境变量
cp .env.example .env

# 编辑 .env，配置数据库连接
# DATABASE_URL="postgresql://user:password@localhost:5432/pingdou"
# REDIS_URL="redis://localhost:6379"

# 生成Prisma客户端
npm run prisma:generate

# 创建数据库（首次）
npx prisma db push

# 或运行迁移
npm run prisma:migrate

# 启动开发服务器（支持热重载）
npm run dev
```

后端将在 http://localhost:4000 运行

### 3. 前端开发环境

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器（支持热重载）
npm run dev
```

前端将在 http://localhost:5173 运行

## 开发工作流

### 分支管理

- `main` - 主分支，保持稳定
- `develop` - 开发分支
- `feature/<feature-name>` - 功能分支
- `bugfix/<bug-name>` - 修复分支
- `release/<version>` - 发布分支

### 提交规范

使用语义化提交信息：

```bash
feat: 添加新功能
fix: 修复bug
docs: 更新文档
style: 代码格式调整（不影响功能）
refactor: 重构代码
test: 添加测试
chore: 构建/工具链更新
```

示例：

```bash
git commit -m "feat: 添加PDF导出功能"
git commit -m "fix: 修复颜色匹配算法精度问题"
```

## 数据库开发

### Prisma工作流

1. **修改Schema**

编辑 `backend/prisma/schema.prisma`

2. **创建迁移**

```bash
npm run prisma:migrate -- --name add_new_field
```

3. **重新生成客户端**

```bash
npm run prisma:generate
```

4. **查看数据库**

```bash
npm run prisma:studio
```

### 数据库种子数据

创建 `backend/prisma/seed.ts`：

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 创建测试管理员
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: 'hashed_password',
      role: 'admin',
    },
  });

  console.log('Seed data created:', admin);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
```

运行种子数据：

```bash
npx prisma db seed
```

## API开发

### 添加新的API端点

1. **定义路由** (`backend/src/routes/example.ts`)

```typescript
import { Router } from 'express';
import * as exampleController from '../controllers/exampleController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.get('/', authenticate, exampleController.getAll);
router.post('/', authenticate, exampleController.create);

export default router;
```

2. **创建控制器** (`backend/src/controllers/exampleController.ts`)

```typescript
import { Response } from 'express';
import { AuthRequest } from '../types';
import { successResponse, errorResponse } from '../utils/response';
import { ExampleService } from '../services/ExampleService';

const service = new ExampleService();

export const getAll = async (req: AuthRequest, res: Response) => {
  try {
    const data = await service.getAll();
    return successResponse(res, data);
  } catch (error: any) {
    return errorResponse(res, 'GET_ERROR', error.message, 500);
  }
};
```

3. **创建服务** (`backend/src/services/ExampleService.ts`)

```typescript
import prisma from '../db';
import logger from '../utils/logger';

export class ExampleService {
  async getAll() {
    return await prisma.example.findMany();
  }
}
```

4. **注册路由** (`backend/src/server.ts`)

```typescript
import exampleRoutes from './routes/example';
app.use('/api/example', exampleRoutes);
```

## 前端开发

### 添加新页面

1. **创建页面组件** (`frontend/src/pages/ExamplePage.tsx`)

```typescript
import { Card } from 'antd';
import Header from '../components/common/Header';

const ExamplePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card title="示例页面">
          内容
        </Card>
      </div>
    </div>
  );
};

export default ExamplePage;
```

2. **添加路由** (`frontend/src/App.tsx`)

```typescript
import ExamplePage from './pages/ExamplePage';

// 在Routes中添加
<Route path="/example" element={<ExamplePage />} />
```

3. **创建API服务** (`frontend/src/services/exampleService.ts`)

```typescript
import apiClient from '../utils/apiClient';

export const exampleService = {
  async getAll() {
    const response = await apiClient.get('/example');
    return response.data;
  },
};
```

### 状态管理

使用Zustand添加新的状态：

```typescript
// frontend/src/store/useAppStore.ts
interface AppState {
  // ... 现有状态
  exampleData: any[];
  setExampleData: (data: any[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // ... 现有实现
  exampleData: [],
  setExampleData: (data) => set({ exampleData: data }),
}));
```

## 测试

### 后端测试

```bash
cd backend

# 运行测试（待实现）
npm test

# 运行测试覆盖率
npm run test:coverage
```

### 前端测试

```bash
cd frontend

# 运行测试（待实现）
npm test

# E2E测试（待实现）
npm run test:e2e
```

## 调试

### 后端调试

VS Code `launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal"
    }
  ]
}
```

### 前端调试

使用浏览器开发者工具：
- React DevTools
- Redux DevTools (如果使用Redux)
- Network面板查看API请求

## 性能优化

### 后端优化

1. **数据库查询优化**

```typescript
// 使用select减少数据传输
const users = await prisma.user.findMany({
  select: {
    id: true,
    username: true,
    email: true,
  },
});

// 使用索引
// 在schema.prisma中添加 @@index([field])
```

2. **添加缓存**

```typescript
import { createClient } from 'redis';

const redis = createClient({ url: config.redis.url });

// 缓存查询结果
async function getCachedData(key: string) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = await fetchData();
  await redis.setEx(key, 3600, JSON.stringify(data));
  return data;
}
```

### 前端优化

1. **代码分割**

```typescript
// 使用React.lazy
const WorkspacePage = React.lazy(() => import('./pages/WorkspacePage'));

<Suspense fallback={<Spin />}>
  <WorkspacePage />
</Suspense>
```

2. **图片优化**

```typescript
// 使用适当的图片格式和尺寸
// 实现懒加载
```

3. **Memo化组件**

```typescript
const MemoizedComponent = React.memo(({ data }) => {
  // 组件实现
});
```

## 代码规范

### TypeScript

- 使用严格模式
- 避免使用 `any`，使用具体类型
- 使用接口定义对象类型
- 使用枚举定义常量

### React

- 使用函数式组件和Hooks
- 组件名使用PascalCase
- Props使用接口定义
- 使用解构赋值

### 命名规范

- 文件名：kebab-case (user-service.ts)
- 组件名：PascalCase (UserProfile.tsx)
- 变量名：camelCase (userData)
- 常量名：UPPER_SNAKE_CASE (API_BASE_URL)
- 类名：PascalCase (UserService)

## 常见问题

### 数据库连接失败

```bash
# 检查PostgreSQL是否运行
sudo systemctl status postgresql

# 检查连接字符串
echo $DATABASE_URL
```

### Prisma客户端未生成

```bash
npm run prisma:generate
```

### 端口被占用

```bash
# 查找占用端口的进程
lsof -i :4000
lsof -i :5173

# 杀死进程
kill -9 <PID>
```

### CORS错误

检查后端的CORS配置和前端的API URL配置。

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

### Pull Request要求

- 描述清晰
- 包含测试
- 通过CI检查
- 代码审查通过

## 资源链接

- [Prisma文档](https://www.prisma.io/docs/)
- [Express文档](https://expressjs.com/)
- [React文档](https://react.dev/)
- [Ant Design文档](https://ant.design/)
- [TypeScript文档](https://www.typescriptlang.org/docs/)
