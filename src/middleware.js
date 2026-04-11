import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Define paths that should be redirected to the main app (app.axile.ng)
  const redirectPaths = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/verify-otp',
    '/dashboard',
    '/profile',
    '/settings',
    '/checkout',
    '/payment',
    '/reset-pin',
    '/referral'
  ]

  // Check if current path starts with any of the redirect paths
  const shouldRedirect = redirectPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  )

  if (shouldRedirect) {
    const url = new URL(request.url)
    const mainAppUrl = (process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://app.axile.ng').replace(/\/$/, '')
    return NextResponse.redirect(`${mainAppUrl}${pathname}${url.search}`)
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/login/:path*',
    '/signup/:path*',
    '/forgot-password/:path*',
    '/reset-password/:path*',
    '/verify-otp/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/checkout/:path*',
    '/payment/:path*',
    '/reset-pin/:path*',
    '/referral/:path*'
  ],
}
