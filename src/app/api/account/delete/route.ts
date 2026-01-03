import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = user.id

    // Delete user data in cascade
    // 1. Delete chat messages
    await supabase
      .from("chat_messages")
      .delete()
      .eq("user_id", userId)

    // 2. Delete task assignments
    await supabase
      .from("task_assignments")
      .delete()
      .eq("assigned_by", userId)

    // 3. Delete tasks created by user
    await supabase
      .from("tasks")
      .delete()
      .eq("created_by", userId)

    // 4. Delete projects created by user
    await supabase
      .from("projects")
      .delete()
      .eq("created_by", userId)

    // 5. Delete pod memberships
    await supabase
      .from("pod_members")
      .delete()
      .eq("user_id", userId)

    // 6. Delete pods created by user
    await supabase
      .from("pods")
      .delete()
      .eq("created_by", userId)

    // 7. Delete user profile
    await supabase
      .from("profiles")
      .delete()
      .eq("id", userId)

    // 8. Delete avatar from storage
    const { data: files } = await supabase.storage
      .from("avatars")
      .list(`users`)

    if (files && files.length > 0) {
      const avatarFiles = files.map((f) => `users/${f.name}`)
      if (avatarFiles.length > 0) {
        await supabase.storage
          .from("avatars")
          .remove(avatarFiles)
      }
    }

    // 9. Delete auth user (this is the final step)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete account: " + deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: "Account deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Delete account error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
