import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 安全头设置
  const response = NextResponse.next()
  
  // 防止点击劫持
  response.headers.set('X-Frame-Options', 'DENY')
  
  // 防止MIME类型嗅探
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // XSS保护
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // 推荐安全传输
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  
  // 内容安全策略
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  )
  
  // 隐藏服务器信息
  response.headers.delete('Server')
  response.headers.delete('X-Powered-By')
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
