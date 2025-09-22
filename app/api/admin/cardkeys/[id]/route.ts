import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
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

// 删除卡密
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    const db = getDatabase();
    const success = await db.deleteCardKey(params.id);
    
    if (!success) {
      return NextResponse.json({ error: '卡密不存在' }, { status: 404 });
    }
    
    return NextResponse.json({ message: '卡密删除成功' });
  } catch (error) {
    console.error('Delete cardkey error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 标记卡密为已使用
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    const { action } = await request.json();
    
    if (action !== 'mark_used' && action !== 'restore') {
      return NextResponse.json({ error: '无效的操作' }, { status: 400 });
    }
    
    const db = getDatabase();
    
    // 首先通过ID找到secure_token
    const cardKeys = await db.getAllCardKeys();
    const cardKey = cardKeys.find(ck => ck.id === params.id);
    
    if (!cardKey) {
      return NextResponse.json({ error: '卡密不存在' }, { status: 404 });
    }
    
    if (action === 'mark_used') {
      const success = await db.markCardKeyAsUsed(cardKey.secure_token);
      
      if (!success) {
        return NextResponse.json({ error: '卡密已被使用或不存在' }, { status: 400 });
      }
      
      return NextResponse.json({ message: '卡密已标记为已使用' });
    } else if (action === 'restore') {
      const success = await db.restoreCardKey(cardKey.secure_token);
      
      if (!success) {
        return NextResponse.json({ error: '卡密未被使用或不存在' }, { status: 400 });
      }
      
      return NextResponse.json({ message: '卡密已恢复为未使用状态' });
    }
  } catch (error) {
    console.error('Mark cardkey used error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
