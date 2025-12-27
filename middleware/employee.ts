import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getEmployeeSession } from '@/lib/employee-auth'

export async function middleware(request: NextRequest) {
  const session = await getEmployeeSession()
  const { pathname } = request.nextUrl

  // Protected employee routes
  if (pathname.startsWith('/employee/leave')) {
    if (!session) {
      const loginUrl = new URL('/employee/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Redirect authenticated users away from login page
  if (pathname === '/employee/login' && session) {
    return NextResponse.redirect(new URL('/employee/leave', request.url))
  }

  return NextResponse.next()
}