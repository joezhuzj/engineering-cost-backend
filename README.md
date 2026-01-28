# 工程造价咨询网站后端API

基于 Node.js + Express + MySQL 的RESTful API服务

## 技术栈

- **框架**: Express.js
- **数据库**: MySQL
- **ORM**: Sequelize
- **认证**: JWT (JSON Web Token)
- **其他**: bcryptjs, cors, dotenv, multer, nodemailer

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=engineering_cost
DB_USER=root
DB_PASSWORD=your_password

JWT_SECRET=your_secret_key
```

### 3. 创建数据库

在MySQL中创建数据库：

```sql
CREATE DATABASE engineering_cost CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 初始化数据库（创建初始管理员）

```bash
npm run init-db
```

默认管理员账号：
- 用户名: `admin`
- 密码: `admin123`

**⚠️ 请在生产环境中立即修改默认密码！**

### 5. 启动服务器

开发环境（自动重启）:
```bash
npm run dev
```

生产环境:
```bash
npm start
```

## API文档

### 认证相关

#### 登录
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

Response:
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

#### 获取当前用户信息
```
GET /api/auth/me
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

### 新闻相关

- `GET /api/news` - 获取新闻列表（支持分页、筛选）
- `GET /api/news/:id` - 获取单个新闻详情
- `POST /api/news` - 创建新闻（需要认证）
- `PUT /api/news/:id` - 更新新闻（需要认证）
- `DELETE /api/news/:id` - 删除新闻（需要认证）

### 案例相关

- `GET /api/cases` - 获取案例列表
- `GET /api/cases/:id` - 获取单个案例详情
- `POST /api/cases` - 创建案例（需要认证）
- `PUT /api/cases/:id` - 更新案例（需要认证）
- `DELETE /api/cases/:id` - 删除案例（需要认证）

### 联系表单

- `POST /api/contacts` - 提交联系表单
- `GET /api/contacts` - 获取联系记录列表（需要认证）
- `GET /api/contacts/:id` - 获取单个联系记录（需要认证）
- `PUT /api/contacts/:id` - 更新联系记录状态（需要认证）

## 项目结构

```
backend/
├── config/          # 配置文件
│   └── database.js  # 数据库配置
├── controllers/     # 控制器
│   └── authController.js
├── middlewares/     # 中间件
│   └── auth.js      # JWT认证中间件
├── models/          # 数据模型
│   ├── User.js
│   ├── News.js
│   ├── Case.js
│   ├── Contact.js
│   └── index.js
├── routes/          # 路由
│   ├── authRoutes.js
│   ├── newsRoutes.js
│   ├── caseRoutes.js
│   └── contactRoutes.js
├── scripts/         # 脚本
│   └── initDatabase.js
├── uploads/         # 上传文件目录
├── .env.example     # 环境变量示例
├── .gitignore
├── package.json
├── README.md
└── server.js        # 入口文件
```

## 数据库表结构

### users (用户表)
- id, username, password, email, role, status

### news (新闻表)
- id, title, category, excerpt, content, cover_image, badge, views, status, publish_date, author_id

### cases (案例表)
- id, title, category, area, cost, description, content, cover_image, images, tags, completion_date, status

### contacts (联系表单)
- id, name, phone, email, company, subject, message, status, ip_address, notes

## 开发说明

### 添加新的API接口

1. 在 `models/` 创建数据模型
2. 在 `controllers/` 创建控制器
3. 在 `routes/` 创建路由
4. 在 `server.js` 中注册路由

### 认证保护

需要认证的接口使用 `authenticateToken` 中间件：

```javascript
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

// 需要登录
router.post('/news', authenticateToken, newsController.create);

// 需要管理员权限
router.delete('/news/:id', authenticateToken, requireAdmin, newsController.delete);
```

## License

MIT
