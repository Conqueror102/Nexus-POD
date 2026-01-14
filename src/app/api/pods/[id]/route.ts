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

  const { title, summary } = await request.json()

  // Check if user is founder
  const { data: pod, error: podError } = await supabase
    .from("pods")
    .select("founder_id")
    .eq("id", params.id)
    .single()

  if (podError || !pod || pod.founder_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized or Pod not found" }, { status: 403 })
  }

  const { data, error } = await supabase
    .from("pods")
    .update({ title, summary, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
