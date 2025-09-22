import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { formatCardKeyForDisplay } from '@/lib/parser';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const isCheck = searchParams.get('check') === 'true';
    const isConfirm = searchParams.get('confirm') === 'true';
    
    const db = getDatabase();
    const cardKey = await db.getCardKeyByToken(params.token);
    
    if (!cardKey) {
      return NextResponse.json({ error: '卡密不存在或已失效' }, { status: 404 });
    }
    
    // 如果是检查状态请求，只返回状态信息
    if (isCheck) {
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
    }
    
    // 如果是确认使用请求，标记为已使用
    if (isConfirm && !cardKey.is_used) {
      await db.markCardKeyAsUsed(params.token);
      // 重新获取更新后的卡密信息
      const updatedCardKey = await db.getCardKeyByToken(params.token);
      const formattedKey = formatCardKeyForDisplay(updatedCardKey!);
      
      return NextResponse.json({ 
        cardKey: {
          ...updatedCardKey,
          // 不返回敏感的内部信息
          id: undefined,
          secure_token: undefined
        },
        formatted: formattedKey
      });
    }
    
    // 普通访问请求（已使用的卡密直接返回信息）
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
