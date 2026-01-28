# 快速启动指南

## 1. 安装Node.js依赖

```bash
npm install
```

## 2. 配置环境变量

创建 `.env` 文件（从 `.env.example` 复制）：

```bash
# Windows PowerShell
copy .env.example .env

# 或者手动创建 .env 文件
```

编辑 `.env` 文件，填写你的数据库配置：

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=engineering_cost
DB_USER=root
DB_PASSWORD=你的MySQL密码

JWT_SECRET=随机生成的密钥
```

## 3. 创建MySQL数据库

打开MySQL命令行或工具（如Navicat），执行：

```sql
CREATE DATABASE engineering_cost CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 4. 初始化数据库

```bash
npm run init-db
```

这将：
- 创建所有数据表
- 创建默认管理员账号（用户名: `admin`, 密码: `admin123`）
- 插入示例数据

## 5. 启动服务器

```bash
# 开发模式（自动重启）
npm run dev

# 或生产模式
npm start
```

## 6. 测试API

### 登录获取token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

### 获取新闻列表

```bash
curl http://localhost:3000/api/news
```

### 获取案例列表

```bash
curl http://localhost:3000/api/cases
```

### 提交联系表单

```bash
curl -X POST http://localhost:3000/api/contacts \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"张三\",\"phone\":\"13800138000\",\"message\":\"咨询工程造价服务\"}"
```

## API端点

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/auth/login | 登录 | ❌ |
| GET | /api/auth/me | 获取当前用户 | ✅ |
| GET | /api/news | 获取新闻列表 | ❌ |
| GET | /api/news/:id | 获取新闻详情 | ❌ |
| POST | /api/news | 创建新闻 | ✅ |
| PUT | /api/news/:id | 更新新闻 | ✅ |
| DELETE | /api/news/:id | 删除新闻 | ✅ |
| GET | /api/cases | 获取案例列表 | ❌ |
| GET | /api/cases/:id | 获取案例详情 | ❌ |
| POST | /api/cases | 创建案例 | ✅ |
| PUT | /api/cases/:id | 更新案例 | ✅ |
| DELETE | /api/cases/:id | 删除案例 | ✅ |
| POST | /api/contacts | 提交联系表单 | ❌ |
| GET | /api/contacts | 获取联系记录 | ✅ |
| GET | /api/contacts/stats | 获取统计数据 | ✅ |
| PUT | /api/contacts/:id | 更新联系记录 | ✅ |
| DELETE | /api/contacts/:id | 删除联系记录 | ✅ |

## 常见问题

### 1. 数据库连接失败

确保：
- MySQL服务已启动
- `.env` 中的数据库配置正确
- 数据库已创建

### 2. 端口被占用

修改 `.env` 中的 `PORT` 配置

### 3. JWT错误

确保 `.env` 中配置了 `JWT_SECRET`

## 下一步

- 前端集成API
- 添加文件上传功能
- 配置邮件发送
- 部署到生产环境
