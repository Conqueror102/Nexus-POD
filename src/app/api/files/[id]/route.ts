import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: file, error: fileError } = await supabase
    .from('pod_files')
    .select('*')
    .eq('id', id)
    .single()

  if (fileError || !file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const { data: membership } = await supabase
    .from('pod_members')
    .select('role')
    .eq('pod_id', file.pod_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this pod' }, { status: 403 })
  }

  const { data: signedUrl } = await supabase.storage
    .from('pod-files')
    .createSignedUrl(file.storage_path, 3600)

  if (!signedUrl) {
    return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
  }

  return NextResponse.json({ url: signedUrl.signedUrl })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: file, error: fileError } = await supabase
    .from('pod_files')
    .select('*')
    .eq('id', id)
    .single()

  if (fileError || !file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const { data: membership } = await supabase
    .from('pod_members')
    .select('role')
    .eq('pod_id', file.pod_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this pod' }, { status: 403 })
  }

  if (membership.role !== 'founder' && file.uploaded_by !== user.id) {
    return NextResponse.json({ error: 'Only file owner or founder can delete' }, { status: 403 })
  }

  await supabase.storage.from('pod-files').remove([file.storage_path])

  const { error: deleteError } = await supabase
    .from('pod_files')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }

  await supabase
    .from('pods')
    .update({ storage_used_bytes: supabase.rpc('decrement_storage', { pod_id: file.pod_id, bytes: file.size_bytes }) })
    .eq('id', file.pod_id)

  const { data: pod } = await supabase
    .from('pods')
    .select('storage_used_bytes')
    .eq('id', file.pod_id)
    .single()

  if (pod) {
    await supabase
      .from('pods')
      .update({ storage_used_bytes: Math.max(0, (pod.storage_used_bytes || 0) - file.size_bytes) })
      .eq('id', file.pod_id)
  }

  return NextResponse.json({ success: true })
}
