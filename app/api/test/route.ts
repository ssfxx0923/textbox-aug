import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 检查环境变量
    const hasDatabase = !!(process.env.DATABASE_URL || process.env.DATABASE_DATABASE_URL);
    
    return NextResponse.json({
      status: 'ok',
      environment: process.env.NODE_ENV,
      hasDatabase,
      databaseUrl: hasDatabase ? 'configured' : 'not configured',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
