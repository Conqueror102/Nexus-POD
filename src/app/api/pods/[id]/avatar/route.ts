import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: podId } = await params

  const { data: membership } = await supabase
    .from("pod_members")
    .select("role")
    .eq("pod_id", podId)
    .eq("user_id", user.id)
    .single()

  if (!membership || membership.role !== "founder") {
    return NextResponse.json({ error: "Only founders can update pod avatar" }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get("avatar") as File | null

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 })
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be less than 2MB" }, { status: 400 })
  }

  const { data: oldPod } = await supabase
    .from("pods")
    .select("avatar_url")
    .eq("id", podId)
    .single()

  if (oldPod?.avatar_url) {
    const oldPath = oldPod.avatar_url.split("/").pop()
    if (oldPath) {
      await supabase.storage.from("pod-avatars").remove([`${podId}/${oldPath}`])
    }
  }

  const fileExt = file.name.split(".").pop() || "jpg"
  const fileName = `${Date.now()}.${fileExt}`
  const filePath = `${podId}/${fileName}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from("pod-avatars")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    console.error("Upload error:", uploadError)
    return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from("pod-avatars")
    .getPublicUrl(filePath)

  const { error: updateError } = await supabase
    .from("pods")
    .update({ avatar_url: publicUrl })
    .eq("id", podId)

  if (updateError) {
    return NextResponse.json({ error: "Failed to update pod" }, { status: 500 })
  }

  return NextResponse.json({ avatar_url: publicUrl })
}
