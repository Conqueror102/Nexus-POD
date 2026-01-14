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

  const { title, summary, updated_at: incoming_updated_at } = await request.json()

  // Check if user is founder
  const { data: pod, error: podError } = await supabase
    .from("pods")
    .select("founder_id, updated_at")
    .eq("id", params.id)
    .single()

  if (podError || !pod || pod.founder_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized or Pod not found" }, { status: 403 })
  }

  // Conflict Resolution: Latest Timestamp Wins
  if (incoming_updated_at && pod.updated_at) {
    const dbTime = new Date(pod.updated_at).getTime()
    if (incoming_updated_at < dbTime) {
      return NextResponse.json(pod)
    }
  }

  const { data, error } = await supabase
    .from("pods")
    .update({ 
      title, 
      summary, 
      updated_at: incoming_updated_at ? new Date(incoming_updated_at).toISOString() : new Date().toISOString() 
    })
    .eq("id", params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
