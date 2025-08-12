import { NextResponse, type NextRequest } from "next/server"

export const isSupabaseConfigured = true

export async function updateSession(request: NextRequest) {
  return NextResponse.next({ request })
}
