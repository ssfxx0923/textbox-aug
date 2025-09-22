import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { verifyJWT } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 验证管理员身份
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const db = getDatabase();
    
    // 获取所有数据
    const cardKeys = await db.getAllCardKeys();
    const stats = await db.getStats();
    
    // 创建备份数据
    const backupData = {
      exportTime: new Date().toISOString(),
      stats,
      cardKeys,
      version: '1.0'
    };

    // 返回 JSON 文件下载
    const response = NextResponse.json(backupData);
    response.headers.set(
      'Content-Disposition',
      `attachment; filename="cardkeys-backup-${new Date().toISOString().split('T')[0]}.json"`
    );
    response.headers.set('Content-Type', 'application/json');

    return response;
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}
