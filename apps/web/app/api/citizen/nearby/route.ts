import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/src/types/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

function getAuthClient() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getServiceClient() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(req: NextRequest) {
  const authClient = getAuthClient();
  const serviceClient = getServiceClient();

  if (!authClient || !serviceClient) {
    return NextResponse.json(
      { error: "Server misconfiguration: missing Supabase environment variables" },
      { status: 500 }
    );
  }
  const authorization = req.headers.get("authorization") ?? "";
  const bearerPrefix = "Bearer ";
  const token = authorization.startsWith(bearerPrefix)
    ? authorization.slice(bearerPrefix.length).trim()
    : "";

  if (!token) {
    return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(token);

  if (authError || !user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await serviceClient
    .from("complaints")
    .select(
      "id,ticket_id,title,description,severity,effective_severity,location,photo_urls,upvote_count,status,created_at,address_text,ward_name,category_id,assigned_department"
    )
    .neq("citizen_id", user.id)
    .order("upvote_count", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message || "Failed to fetch nearby complaints" }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}
