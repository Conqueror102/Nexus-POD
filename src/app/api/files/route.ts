import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const MAX_POD_STORAGE = 1024 * 1024 * 1024 // 1GB in bytes
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB in bytes

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  const pod_id = formData.get('pod_id') as string

  if (!file || !pod_id) {
    return NextResponse.json({ error: 'File and pod_id are required' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File size exceeds 25MB limit' }, { status: 400 })
  }

  const { data: membership } = await supabase
    .from('pod_members')
    .select('role')
    .eq('pod_id', pod_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this pod' }, { status: 403 })
  }

  const { data: pod } = await supabase
    .from('pods')
    .select('storage_used_bytes')
    .eq('id', pod_id)
    .single()

  if (!pod) {
    return NextResponse.json({ error: 'Pod not found' }, { status: 404 })
  }

  if ((pod.storage_used_bytes || 0) + file.size > MAX_POD_STORAGE) {
    return NextResponse.json({ error: 'Pod storage limit exceeded (1GB max)' }, { status: 400 })
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${pod_id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('pod-files')
    .upload(fileName, file)

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }

  const { data: fileRecord, error: dbError } = await supabase
    .from('pod_files')
    .insert({
      pod_id,
      uploaded_by: user.id,
      name: file.name,
      size_bytes: file.size,
      mime_type: file.type,
      storage_path: fileName,
    })
    .select()
    .single()

  if (dbError) {
    await supabase.storage.from('pod-files').remove([fileName])
    return NextResponse.json({ error: 'Failed to save file record' }, { status: 500 })
  }

  await supabase
    .from('pods')
    .update({ storage_used_bytes: (pod.storage_used_bytes || 0) + file.size })
    .eq('id', pod_id)

  return NextResponse.json(fileRecord)
}

export async function GET(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const pod_id = searchParams.get('pod_id')

  if (!pod_id) {
    return NextResponse.json({ error: 'Pod ID is required' }, { status: 400 })
  }

  const { data: membership } = await supabase
    .from('pod_members')
    .select('role')
    .eq('pod_id', pod_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this pod' }, { status: 403 })
  }

  const { data: files, error } = await supabase
    .from('pod_files')
    .select(`
      *,
      profiles:uploaded_by (
        id,
        display_name,
        email,
        avatar_url
      )
    `)
    .eq('pod_id', pod_id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
  }

  return NextResponse.json(files)
}
