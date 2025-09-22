import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 验证管理员身份
    const token = request.cookies.get('admin-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 检查环境变量和数据库状态
    const status = {
      environment: process.env.NODE_ENV,
      databaseType: process.env.DATABASE_TYPE || 'auto',
      environmentVariables: {
        hasUpstashUrl: !!(process.env.UPSTASH_REDIS_REST_URL || process.env.STORAGE_URL),
        hasUpstashToken: !!(process.env.UPSTASH_REDIS_REST_TOKEN || process.env.STORAGE_TOKEN),
        hasVercelKvUrl: !!process.env.KV_REST_API_URL,
        hasVercelKvToken: !!process.env.KV_REST_API_TOKEN,
        upstashUrl: process.env.UPSTASH_REDIS_REST_URL ? 'Set (UPSTASH_REDIS_REST_URL)' : 
                    process.env.STORAGE_URL ? 'Set (STORAGE_URL)' : 'Not set',
        upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN ? 'Set (UPSTASH_REDIS_REST_TOKEN)' : 
                      process.env.STORAGE_TOKEN ? 'Set (STORAGE_TOKEN)' : 'Not set',
      },
      timestamp: new Date().toISOString()
    };

    // 尝试检测当前使用的数据库类型
    let currentDatabaseType = 'unknown';
    try {
      const { getDatabase } = await import('@/lib/database');
      const db = getDatabase();
      
      if (db.constructor.name.includes('Upstash')) {
        currentDatabaseType = 'upstash';
      } else if (db.constructor.name.includes('KV')) {
        currentDatabaseType = 'kv';
      } else {
        currentDatabaseType = 'json';
      }
    } catch (error) {
      currentDatabaseType = 'error: ' + (error as Error).message;
    }

    return NextResponse.json({
      ...status,
      currentDatabaseType,
      recommendation: getCurrentRecommendation(status)
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check status',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

function getCurrentRecommendation(status: any): string {
  const { environmentVariables } = status;
  
  if (environmentVariables.hasUpstashUrl && environmentVariables.hasUpstashToken) {
    if (status.databaseType === 'upstash') {
      return '✅ Upstash Redis configured correctly';
    } else {
      return '⚠️ Upstash Redis available but DATABASE_TYPE not set to "upstash"';
    }
  }
  
  if (environmentVariables.hasVercelKvUrl && environmentVariables.hasVercelKvToken) {
    if (status.databaseType === 'kv') {
      return '✅ Vercel KV configured correctly';
    } else {
      return '⚠️ Vercel KV available but DATABASE_TYPE not set to "kv"';
    }
  }
  
  return '❌ No persistent database configured. Using JSON storage (data will be lost on restart)';
}
