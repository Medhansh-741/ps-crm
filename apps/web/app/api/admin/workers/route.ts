import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/src/types/database.types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function getSupabaseAdminClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

type CreateWorkerPayload = {
  full_name?: string
  email?: string
  password?: string
  phone?: string | null
  city?: string | null
  department?: string
}

type AssignDepartmentPayload = {
  worker_id?: string
  department?: string
}

function getBearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization")
  if (!header || !header.startsWith("Bearer ")) return null
  return header.slice(7)
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function requireAdmin(supabaseAdmin: SupabaseClient<Database>, req: NextRequest) {
  const token = getBearerToken(req)
  if (!token) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !authData.user) {
    return { error: NextResponse.json({ error: "Invalid session" }, { status: 401 }) }
  }

  const { data: callerProfile, error: callerProfileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle()

  const profileRole = (callerProfile?.role ?? "").toString().trim().toLowerCase()
  const metadataRole = (authData.user.user_metadata?.role ?? "").toString().trim().toLowerCase()
  const isAdmin = profileRole === "admin" || metadataRole === "admin"

  if (callerProfileError || !isAdmin) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { userId: authData.user.id }
}

export async function GET(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdminClient()
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server misconfiguration: missing Supabase service role key" }, { status: 500 })
  }

  const authResult = await requireAdmin(supabaseAdmin, req)
  if ("error" in authResult) return authResult.error

  const [profilesResult, complaintsResult, workerProfilesResult, categoriesResult] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, phone, city, department, is_blocked, created_at")
      .eq("role", "worker")
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("complaints").select("id, assigned_worker_id, assigned_department, status, created_at, resolved_at"),
    supabaseAdmin
      .from("worker_profiles")
      .select("worker_id, department, availability, total_resolved"),
    supabaseAdmin.from("categories").select("name, department").eq("is_active", true),
  ])

  const firstError = profilesResult.error || complaintsResult.error || workerProfilesResult.error || categoriesResult.error
  if (firstError) {
    return NextResponse.json({ error: firstError.message || "Failed to load workers data" }, { status: 500 })
  }

  return NextResponse.json({
    profiles: profilesResult.data ?? [],
    complaints: complaintsResult.data ?? [],
    workerProfiles: workerProfilesResult.data ?? [],
    categories: categoriesResult.data ?? [],
  })
}

export async function PATCH(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdminClient()
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server misconfiguration: missing Supabase service role key" }, { status: 500 })
  }

  const authResult = await requireAdmin(supabaseAdmin, req)
  if ("error" in authResult) return authResult.error

  const body = (await req.json().catch(() => null)) as AssignDepartmentPayload | null
  const workerId = body?.worker_id?.trim() ?? ""
  const department = body?.department?.trim() ?? ""

  if (!workerId || !department) {
    return NextResponse.json({ error: "worker_id and department are required" }, { status: 400 })
  }

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ department })
    .eq("id", workerId)

  if (profileError) {
    return NextResponse.json({ error: profileError.message || "Failed to update worker department" }, { status: 500 })
  }

  await supabaseAdmin.from("worker_profiles").upsert(
    {
      worker_id: workerId,
      department,
      availability: "available",
    },
    { onConflict: "worker_id" },
  )

  await supabaseAdmin
    .from("complaints")
    .update({ assigned_department: department })
    .eq("assigned_worker_id", workerId)
    .in("status", ["submitted", "under_review", "assigned", "in_progress", "escalated"])

  return NextResponse.json({ success: true })
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdminClient()
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server misconfiguration: missing Supabase service role key" }, { status: 500 })
  }

  const authResult = await requireAdmin(supabaseAdmin, req)
  if ("error" in authResult) return authResult.error

  const body = (await req.json().catch(() => null)) as CreateWorkerPayload | null
  const fullName = body?.full_name?.trim() ?? ""
  const email = body?.email?.trim().toLowerCase() ?? ""
  const password = body?.password ?? ""
  const phone = body?.phone?.trim() || null
  const city = body?.city?.trim() || null
  const department = body?.department?.trim() ?? ""

  if (!fullName || !email || !department || !password) {
    return NextResponse.json({ error: "Name, email, password and department are required" }, { status: 400 })
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }

  // Keep auth user creation payload minimal to avoid metadata-trigger failures in some Supabase setups.
  const { data: createdUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createUserError || !createdUser.user) {
    const message = createUserError?.message || "Failed to create auth user"
    const help =
      message.toLowerCase().includes("database error creating new user")
        ? "Supabase auth trigger failed while creating user. Check auth->profiles trigger and required columns."
        : undefined

    return NextResponse.json({ error: message, details: help }, { status: 400 })
  }

  const userId = createdUser.user.id

  // Best effort metadata update for downstream role checks and auditing.
  await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: {
      full_name: fullName,
      role: "worker",
      department,
    },
  })

  const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
    {
      id: userId,
      email,
      full_name: fullName,
      phone,
      city,
      department,
      role: "worker",
      is_blocked: false,
    },
    { onConflict: "id" },
  )

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: profileError.message || "Failed to create worker profile" }, { status: 500 })
  }

  const { error: workerProfileError } = await supabaseAdmin.from("worker_profiles").upsert(
    {
      worker_id: userId,
      department,
      city: city || "Unknown",
      availability: "available",
    },
    { onConflict: "worker_id" },
  )

  if (workerProfileError) {
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: workerProfileError.message || "Failed to create worker details" }, { status: 500 })
  }

  return NextResponse.json(
    {
      id: userId,
      email,
      full_name: fullName,
      role: "worker",
      department,
    },
    { status: 201 },
  )
}
