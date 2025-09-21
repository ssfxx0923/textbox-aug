import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { getDatabase } from '@/lib/database';
import { parseCardKeysText } from '@/lib/parser';

// 验证管理员权限的中间件
async function verifyAdmin(request: NextRequest) {
  const token = request.cookies.get('admin-token')?.value;
  if (!token) {
    return null;
  }
  
  const payload = await verifyJWT(token);
  return payload;
}

// 获取所有卡密
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    const db = getDatabase();
    const cardKeys = db.getAllCardKeys();
    const stats = db.getStats();
    
    return NextResponse.json({ cardKeys, stats });
  } catch (error) {
    console.error('Get cardkeys error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 添加卡密
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    const { text, single } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: '卡密数据不能为空' }, { status: 400 });
    }
    
    const db = getDatabase();
    
    if (single) {
      // 单个卡密添加
      const cardData = JSON.parse(text);
      const token = db.addCardKey(cardData);
      return NextResponse.json({ 
        message: '卡密添加成功',
        token,
        link: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/key/${token}`
      });
    } else {
      // 批量导入
      const parsedCards = parseCardKeysText(text);
      
      if (parsedCards.length === 0) {
        return NextResponse.json({ error: '未能解析到有效的卡密数据' }, { status: 400 });
      }
      
      const tokens = db.batchAddCardKeys(parsedCards);
      const links = tokens.map(token => 
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/key/${token}`
      );
      
      return NextResponse.json({ 
        message: `成功导入 ${tokens.length} 个卡密`,
        count: tokens.length,
        links
      });
    }
  } catch (error) {
    console.error('Add cardkeys error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
