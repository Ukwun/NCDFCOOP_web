import { NextRequest, NextResponse } from 'next/server';

const DEVELOPMENT_ONLY_PATHS = ['/seed', '/diagnostics'];

export function middleware(request: NextRequest) {
  if (
    process.env.NODE_ENV === 'production' &&
    DEVELOPMENT_ONLY_PATHS.some(
      (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`),
    )
  ) {
    return new NextResponse('Not found', {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/seed/:path*', '/diagnostics/:path*'],
};
