// 演示脚本 - 可以用来测试系统功能
const fs = require('fs');
const path = require('path');

console.log('🚀 卡密管理系统演示');
console.log('==================');
console.log('');
console.log('1. 安装依赖：npm install');
console.log('2. 复制环境配置：cp env.example .env.local');
console.log('3. 启动开发服务器：npm run dev');
console.log('4. 访问 http://localhost:3000');
console.log('5. 管理后台：http://localhost:3000/admin');
console.log('   - 用户名：admin');
console.log('   - 密码：admin123');
console.log('');
console.log('📋 系统功能：');
console.log('- ✅ 批量导入卡密（支持text.txt格式）');
console.log('- ✅ 安全链接生成（64位随机令牌）');
console.log('- ✅ 使用状态追踪');
console.log('- ✅ 管理后台界面');
console.log('- ✅ 响应式设计');
console.log('- ✅ 一键复制功能');
console.log('');
console.log('🔒 安全特性：');
console.log('- JWT认证 + HTTP-only Cookie');
console.log('- 随机令牌生成');
console.log('- 安全HTTP头');
console.log('- 输入验证');
console.log('');
console.log('🚀 部署到Vercel：');
console.log('1. 推送代码到GitHub');
console.log('2. 在Vercel中导入项目');
console.log('3. 设置环境变量：');
console.log('   - JWT_SECRET: 强随机字符串');
console.log('   - NEXT_PUBLIC_BASE_URL: 你的域名');
console.log('4. 自动部署完成');
console.log('');

// 检查是否存在text.txt并显示示例
const textFilePath = path.join(process.cwd(), 'text.txt');
if (fs.existsSync(textFilePath)) {
  console.log('📁 发现 text.txt 文件，可以直接用于测试导入功能！');
  console.log('');
}

console.log('✨ 开始使用吧！');
