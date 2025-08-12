import { cache } from "react"
import { cookies } from "next/headers"

export const isSupabaseConfigured = true

async function api(path: string, init?: RequestInit) {
  const token = cookies().get("token")?.value
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  })
  if (!res.ok) return null
  return res.json()
}

export const createClient = cache(() => {
  return {
    auth: {
      getUser: async () => {
        const me = await api("/users/me")
        return { data: { user: me ? { id: me.id, email: me.email } : null }, error: null }
      },
      getSession: async () => {
        const token = cookies().get("token")?.value
        return { data: { session: token ? { access_token: token } : null }, error: null }
      },
    },
  }
})
