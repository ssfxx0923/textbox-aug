# 卡密管理系统

一个安全的卡密传递与管理平台，支持批量导入、安全链接生成和使用追踪。

## 功能特性

- **安全链接生成**：为每个卡密生成唯一的64位随机令牌链接
- **批量导入**：支持从text.txt格式批量导入卡密数据
- **使用追踪**：自动记录卡密使用状态和时间
- **确认使用**：首次访问需要用户确认使用，防止误操作
- **分类管理**：按使用状态筛选卡密（全部/已使用/未使用）
- **卡密恢复**：将误标记为已使用的卡密恢复为未使用状态
- **批量导出**：导出未使用卡密的链接和详细信息
- **管理后台**：完整的管理功能，包含统计和操作
- **响应式设计**：支持PC和移动端访问
- **安全防护**：包含多层安全防护机制

## 技术栈

- **前端**：Next.js 14 + React + TypeScript + Tailwind CSS
- **后端**：Next.js API Routes
- **数据库**：JSON文件存储 (无需编译，跨平台兼容)
- **认证**：JWT + HTTP-only Cookies
- **部署**：Vercel

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

复制 `env.example` 为 `.env.local` 并修改配置：

```bash
cp env.example .env.local
```

修改 `.env.local` 文件：

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 管理后台

访问 [http://localhost:3000/admin](http://localhost:3000/admin) 进入管理后台。

默认管理员账号：
- 用户名：`admin`
- 密码：`admin123`

## 部署到Vercel

### 快速部署

1. **推送代码到GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/card-key-manager.git
   git push -u origin main
   ```

2. **连接Vercel**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 "New Project" 并导入GitHub仓库

3. **配置环境变量**
   在Vercel项目设置中添加：
   ```
   JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
   NEXT_PUBLIC_BASE_URL=https://your-project-name.vercel.app
   ```

4. **自动部署**
   Vercel会自动构建和部署应用

> 📖 **详细部署指南**：查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 获取完整的部署说明和故障排除指南。

## 使用说明

### 管理端操作

1. **登录管理后台**
   - 直接访问 `/admin` 路径
   - 使用管理员账号登录

2. **批量导入卡密**
   - 点击"批量导入卡密"按钮
   - 粘贴text.txt格式的卡密数据
   - 点击"导入"完成

3. **管理卡密**
   - 查看所有卡密列表和统计
   - 按状态筛选卡密（全部/已使用/未使用）
   - 复制卡密访问链接
   - 标记卡密为已使用
   - 恢复已使用的卡密为未使用状态
   - 删除不需要的卡密
   - 批量导出未使用卡密的链接或详细信息

### 用户端访问

1. 通过管理员提供的链接访问卡密
2. 链接格式：`https://your-domain.com/key/[token]`
3. 首次访问需要确认使用（显示基本信息和重要提示）
4. 确认后自动标记为已使用，并显示完整卡密信息
5. 再次访问已使用的卡密直接显示信息，无需重新确认
6. 支持一键复制功能

## 安全特性

- **随机令牌**：使用crypto.randomBytes生成64位安全令牌
- **JWT认证**：管理员使用JWT token认证
- **HTTP-only Cookie**：防止XSS攻击
- **安全头**：包含多种安全HTTP头
- **输入验证**：严格的数据验证和清理
- **访问追踪**：记录卡密访问时间
- **隐藏后台**：首页不暴露管理后台入口
- **搜索引擎屏蔽**：robots.txt阻止爬虫索引

## 数据格式

支持的卡密text格式：

```
您的登录信息如下
租户URL：https://d5.api.augmentcode.com/
访问令牌(Token)：adac8e776bbc99414706e35236cba18116220b06c09035827b0dc11671749a3f
邮箱：jameswalkermftunoty0032@meiyouhanyi.site
余额查询URL：https://portal.withorb.com/view?token=IkxwNnBWRjR1UnI0RHRwdVci.W4P8hs7XUtgtD6bGZm-ZYvNTDNg
实际到期日：2025-09-28
查询参数：day=6
----------------
```

**注意**：查询参数会被系统解析和存储，但不会在用户界面中显示，因为对最终用户来说没有实际意义。

## 开发说明

### 项目结构

```
├── app/
│   ├── admin/              # 管理后台页面
│   ├── api/               # API路由
│   ├── key/[token]/       # 卡密访问页面
│   └── globals.css        # 全局样式
├── lib/
│   ├── database.ts        # 数据库操作
│   ├── auth.ts           # 认证相关
│   └── parser.ts         # 数据解析
├── middleware.ts          # 中间件
└── vercel.json           # Vercel配置
```

### API接口

- `POST /api/admin/login` - 管理员登录
- `POST /api/admin/logout` - 管理员退出
- `GET /api/admin/cardkeys` - 获取所有卡密
- `POST /api/admin/cardkeys` - 添加卡密
- `DELETE /api/admin/cardkeys/[id]` - 删除卡密
- `PATCH /api/admin/cardkeys/[id]` - 标记已使用
- `GET /api/key/[token]` - 获取卡密信息

## 许可证

MIT License

## 贡献

欢迎提交Issues和Pull Requests！
