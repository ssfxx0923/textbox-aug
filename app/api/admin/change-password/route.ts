import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, hashPassword, verifyPassword } from '@/lib/auth';
import { getDatabase } from '@/lib/database';

// 验证管理员权限的中间件
async function verifyAdmin(request: NextRequest) {
  const token = request.cookies.get('admin-token')?.value;
  if (!token) {
    return null;
  }
  
  const payload = await verifyJWT(token);
  return payload;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    const { currentPassword, newPassword } = await request.json();
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: '当前密码和新密码不能为空' }, { status: 400 });
    }
    
    if (newPassword.length < 6) {
      return NextResponse.json({ error: '新密码长度至少6位' }, { status: 400 });
    }
    
    const db = getDatabase();
    const adminUser = await db.getAdminByUsername(admin.username) as any;
    
    if (!adminUser) {
      return NextResponse.json({ error: '管理员不存在' }, { status: 404 });
    }
    
    // 验证当前密码
    const isCurrentPasswordValid = await verifyPassword(currentPassword, adminUser.password_hash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: '当前密码错误' }, { status: 400 });
    }
    
    // 生成新密码哈希
    const newPasswordHash = await hashPassword(newPassword);
    
    // 更新密码
    const success = await db.updateAdminPassword(admin.username, newPasswordHash);
    
    if (!success) {
      return NextResponse.json({ error: '密码更新失败' }, { status: 500 });
    }
    
    return NextResponse.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
