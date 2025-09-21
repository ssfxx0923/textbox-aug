import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { formatCardKeyForDisplay } from '@/lib/parser';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const db = getDatabase();
    const cardKey = db.getCardKeyByToken(params.token);
    
    if (!cardKey) {
      return NextResponse.json({ error: '卡密不存在或已失效' }, { status: 404 });
    }
    
    // 自动标记为已使用（可选，根据需求决定）
    if (!cardKey.is_used) {
      db.markCardKeyAsUsed(params.token);
    }
    
    const formattedKey = formatCardKeyForDisplay(cardKey);
    
    return NextResponse.json({ 
      cardKey: {
        ...cardKey,
        // 不返回敏感的内部信息
        id: undefined,
        secure_token: undefined
      },
      formatted: formattedKey
    });
  } catch (error) {
    console.error('Get cardkey error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
