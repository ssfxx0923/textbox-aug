import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const db = getDatabase();
    
    // 检查是否已经有管理员账号
    const existingAdmin = await db.getAdminByUsername('admin');
    
    if (existingAdmin) {
      return NextResponse.json(
        { error: '管理员账号已存在' },
        { status: 400 }
      );
    }
    
    // 创建默认管理员账号
    const passwordHash = await bcrypt.hash('admin123', 12);
    await db.addAdmin('admin', passwordHash);
    
    return NextResponse.json({
      message: '默认管理员账号创建成功',
      username: 'admin',
      password: 'admin123',
      note: '请尽快登录后台修改密码'
    });
    
  } catch (error) {
    console.error('Error initializing admin:', error);
    return NextResponse.json(
      { error: '初始化管理员账号失败' },
      { status: 500 }
    );
  }
}
