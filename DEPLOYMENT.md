# Vercel 部署指南

## 快速部署步骤

### 1. 准备代码
确保您的代码已经推送到GitHub仓库。

### 2. 连接Vercel
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 选择您的GitHub仓库
4. 点击 "Import"

### 3. 配置环境变量
在Vercel项目设置中添加以下环境变量：

**必需的环境变量：**
- `JWT_SECRET`: 一个强随机字符串（用于JWT token签名）
- `NEXT_PUBLIC_BASE_URL`: 您的Vercel域名

**设置步骤：**
1. 在Vercel项目页面点击 "Settings"
2. 点击 "Environment Variables"
3. 添加以下变量：

```
Name: JWT_SECRET
Value: your-super-secret-jwt-key-at-least-32-characters-long

Name: NEXT_PUBLIC_BASE_URL  
Value: https://your-project-name.vercel.app
```

### 4. 生成JWT密钥
您可以使用以下方法生成安全的JWT密钥：

**方法1：使用Node.js**
```javascript
require('crypto').randomBytes(32).toString('hex')
```

**方法2：使用在线工具**
访问 https://generate-secret.vercel.app/32 生成32字节的随机密钥

**方法3：使用命令行**
```bash
openssl rand -hex 32
```

### 5. 部署
设置完环境变量后，Vercel会自动重新部署您的应用。

## 部署后设置

### 1. 获取域名
部署成功后，Vercel会为您分配一个域名，格式如：
`https://your-project-name.vercel.app`

### 2. 更新环境变量
如果您的域名与之前设置的不同，请更新 `NEXT_PUBLIC_BASE_URL` 环境变量。

### 3. 测试功能
1. 访问您的域名
2. 进入管理后台：`https://your-domain.vercel.app/admin`
3. 使用默认账号登录：`admin` / `admin123`
4. 测试导入卡密功能

## 常见问题解决

### 问题1：JWT_SECRET错误
**错误信息：** `Environment Variable "JWT_SECRET" references Secret "jwt-secret", which does not exist.`

**解决方案：**
1. 删除 `vercel.json` 中的环境变量配置（已修复）
2. 在Vercel Dashboard中手动添加环境变量
3. 重新部署

### 问题2：数据库问题
**说明：** 本应用使用JSON文件存储，在Vercel上数据存储在 `/tmp` 目录中，重启后会丢失。

**生产环境建议：**
- 使用外部数据库（如PlanetScale、Supabase）
- 使用Vercel KV存储

### 问题3：文件上传限制
Vercel对无服务器函数有执行时间和内存限制：
- 执行时间：最长30秒（已在vercel.json中配置）
- 内存：1GB（Hobby计划）

## 安全建议

### 生产环境安全检查
1. **更改默认管理员密码**
   - 登录后台后立即更改密码
   
2. **使用强JWT密钥**
   - 至少32字符的随机字符串
   - 定期轮换密钥

3. **启用HTTPS**
   - Vercel默认启用HTTPS
   - 确保所有链接使用HTTPS

4. **域名配置**
   - 考虑使用自定义域名
   - 配置适当的DNS设置

## 监控和维护

### 1. 查看日志
在Vercel Dashboard的"Functions"标签页可以查看执行日志。

### 2. 性能监控
Vercel提供内置的性能监控和分析功能。

### 3. 数据备份
由于使用临时存储，建议定期导出重要数据。

## 升级和更新

### 自动部署
连接GitHub后，每次推送代码到主分支都会自动触发部署。

### 手动部署
在Vercel Dashboard中可以手动触发重新部署。

---

如有问题，请检查Vercel的部署日志或联系技术支持。
