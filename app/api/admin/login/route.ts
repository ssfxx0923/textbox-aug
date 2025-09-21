import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, initDefaultAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // 确保默认管理员存在
    await initDefaultAdmin();
    
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
    }
    
    const result = await authenticateAdmin(username, password);
    
    if (!result) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }
    
    const response = NextResponse.json({ 
      message: '登录成功',
      admin: result.admin 
    });
    
    // 设置HTTP-only cookie
    response.cookies.set('admin-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 // 24小时
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
