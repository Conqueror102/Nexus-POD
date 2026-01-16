import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const publicPaths = ['/', '/login', '/signup', '/auth/callback', '/join', '/offline']
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith('/join/')
  )

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user && !isPublicPath) {
      const hasAuthCookie = request.cookies.getAll().some(c => 
        c.name.includes('supabase') && c.name.includes('auth')
      )
      
      if (hasAuthCookie) {
        supabaseResponse.headers.set('x-offline-mode', 'possible')
        return supabaseResponse
      }
      
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    if (request.nextUrl.pathname.startsWith('/admin')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single()

      if (profile?.role !== 'admin') {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }

    return supabaseResponse
  } catch (error) {
    console.warn('Middleware error (possibly offline):', error)
    
    const hasAuthCookie = request.cookies.getAll().some(c => 
      c.name.includes('supabase') && c.name.includes('auth')
    )
    
    if (hasAuthCookie || isPublicPath) {
      supabaseResponse.headers.set('x-offline-mode', 'true')
      return supabaseResponse
    }
    
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
}
