import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, description } = await request.json()

  // Only founder can edit projects
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("pod_id, pods(founder_id)")
    .eq("id", params.id)
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  // @ts-ignore
  if (project.pods.founder_id !== user.id) {
    return NextResponse.json({ error: "Only the founder can edit projects" }, { status: 403 })
  }

  const { data, error } = await supabase
    .from("projects")
    .update({ name, description, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Only founder can delete projects
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("pod_id, pods(founder_id)")
    .eq("id", params.id)
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  // @ts-ignore
  if (project.pods.founder_id !== user.id) {
    return NextResponse.json({ error: "Only the founder can delete projects" }, { status: 403 })
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
