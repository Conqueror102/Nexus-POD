import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const pod_id = searchParams.get('pod_id')
  const format = searchParams.get('format') || 'json'
  if (!pod_id) return NextResponse.json({ error: 'Pod ID required' }, { status: 400 })

  const { data: membership } = await supabase.from('pod_members').select('role').eq('pod_id', pod_id).eq('user_id', user.id).single()
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: pod } = await supabase.from('pods').select('title').eq('id', pod_id).single()
  const { data: projects } = await supabase.from('projects').select('*').eq('pod_id', pod_id)
  const projectIds = projects?.map(p => p.id) || []
  
  const { data: tasks } = projectIds.length > 0 
    ? await supabase.from('tasks').select('*, projects(name)').in('project_id', projectIds)
    : { data: [] }

  const exportData = {
    pod: pod?.title,
    exportedAt: new Date().toISOString(),
    projects: projects?.map(p => ({ name: p.name, description: p.description })) || [],
    tasks: tasks?.map(t => ({
      name: t.name,
      description: t.description,
      status: t.status,
      priority: t.priority || 'medium',
      dueDate: t.due_date,
      project: t.projects?.name
    })) || []
  }

  if (format === 'csv') {
    const csvRows = ['Task Name,Description,Status,Priority,Due Date,Project']
    exportData.tasks.forEach(t => {
      csvRows.push(`"${t.name}","${t.description}","${t.status}","${t.priority}","${t.dueDate}","${t.project}"`)
    })
    return new NextResponse(csvRows.join('\n'), {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="${pod?.title || 'export'}-tasks.csv"` }
    })
  }

  return NextResponse.json(exportData)
}
