# 拼豆图纸转换工具 - 后端服务

## 技术栈

- Node.js + TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- Redis
- JWT认证

## 安装依赖

```bash
npm install
```

## 配置环境变量

复制 `.env.example` 到 `.env` 并填写配置：

```bash
cp .env.example .env
```

## 数据库设置

```bash
# 生成Prisma客户端
npm run prisma:generate

# 创建数据库迁移
npm run prisma:migrate

# 打开Prisma Studio查看数据
npm run prisma:studio
```

## 开发

```bash
npm run dev
```

## 构建

```bash
npm run build
```

## 生产环境运行

```bash
npm start
```

## API文档

### 认证接口

#### 注册
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Password123"
}
```

#### 登录
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Password123"
}
```

#### 获取当前用户信息
```
GET /api/auth/me
Authorization: Bearer <access_token>
```

### 兑换码接口

#### 兑换激活码
```
POST /api/redemption/redeem
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "code": "XXXX-XXXX-XXXX-XXXX"
}
```

#### 查询我的激活记录
```
GET /api/redemption/my-activations
Authorization: Bearer <access_token>
```

#### 检查激活状态
```
GET /api/redemption/check-status
Authorization: Bearer <access_token>
```

### 管理员接口

#### 生成兑换码
```
POST /api/admin/redemption/generate
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "codeType": "trial_30",
  "quantity": 10,
  "batchId": "BATCH_001",
  "validUntil": "2025-12-31T23:59:59.000Z"
}
```

#### 查询兑换码列表
```
GET /api/admin/redemption/list?page=1&limit=20&status=unused
Authorization: Bearer <access_token>
```

#### 撤销兑换码
```
POST /api/admin/redemption/revoke/:id
Authorization: Bearer <access_token>
```

## 兑换码类型

- `trial_30`: 体验版（30天）
- `standard_90`: 标准版（90天）
- `premium_365`: 高级版（365天）
