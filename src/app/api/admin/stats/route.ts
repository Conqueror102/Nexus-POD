import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const [
      { count: userCount },
      { count: podCount },
      { count: projectCount },
      { count: taskCount },
      { data: recentActivity },
      { data: activeSubscriptions }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('pods').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('pod_subscriptions').select('*').eq('status', 'active')
    ])

    const totalRevenue = activeSubscriptions?.reduce((acc, sub) => {
      // Assuming lite_plan for now, in a real scenario we'd join with system_plans
      return acc + 500000 // 5000 NGN in kobo
    }, 0) || 0

    return NextResponse.json({
      stats: {
        users: userCount || 0,
        pods: podCount || 0,
        projects: projectCount || 0,
        tasks: taskCount || 0,
        revenue: totalRevenue / 100, // Convert to NGN
      },
      recentActivity,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
