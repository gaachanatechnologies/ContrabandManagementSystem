export const isSupabaseConfigured = true

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

function getToken() {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/(?:^|; )token=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

async function api(path: string, options: RequestInit = {}) {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": (options.body instanceof FormData ? undefined : "application/json") as any,
    ...(options.headers as Record<string, string>),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed: ${res.status}`)
  }
  const contentType = res.headers.get("content-type") || ""
  if (contentType.includes("application/json")) return res.json()
  return res
}

export const supabase = {
  auth: {
    async getUser() {
      try {
        const token = getToken()
        if (!token) return { data: { user: null } }
        const me = await api("/users/me")
        return { data: { user: { id: me.id, email: me.email } } }
      } catch {
        return { data: { user: null } }
      }
    },
    async getSession() {
      const token = getToken()
      return { data: { session: token ? { access_token: token } : null } }
    },
    admin: {
      async createUser({ email, password, email_confirm }: { email: string; password: string; email_confirm?: boolean }) {
        const res = await api("/users", { method: "POST", body: JSON.stringify({ email, password, full_name: email.split("@")[0], role: "field_officer" }) })
        return { data: { user: { id: res.id, email } } }
      },
    },
  },
  from(table: string) {
    return {
      select: async (query?: string) => {
        switch (table) {
          case "contraband_items":
            const items = await api("/contraband-items")
            return { data: items }
          case "contraband_categories":
            const cats = await api("/categories")
            return { data: cats }
          case "users":
            const rawUsers = await api("/users")
            return {
              data: (rawUsers || []).map((u: any) => ({
                id: u.id,
                email: u.email,
                full_name: u.fullName,
                badge_number: u.badgeNumber,
                role: u.role,
                department: u.department,
                phone: u.phone,
                is_active: u.active ?? u.isActive,
                created_at: u.createdAt,
              })),
            }
          case "messages":
            // Expect a userId filter later via .or() pattern; fall back to /users/me
            const me = await api("/users/me")
            const msgs = await api(`/messages?userId=${me.id}`)
            return { data: msgs }
          case "custody_chain":
            // Need contrabandId filter; caller should use eq() variant; we will throw here
            throw new Error("Use chain API via eq in wrapper")
          case "evidence_files":
            return { data: [] }
          case "audit_logs":
            const logs = await fetch(`${API_BASE}/audit-logs`, { cache: "no-store" }).then((r) => r.json())
            return { data: logs }
          default:
            throw new Error(`Unsupported table: ${table}`)
        }
      },
      order: async (field: string, opts?: { ascending?: boolean }) => {
        // No-op for now, server returns in useful order
        // This path is only reached when select() is chained
        switch (table) {
          case "contraband_items":
            const items = await api("/contraband-items")
            return { data: items }
          default:
            return { data: [] }
        }
      },
      insert: async (payload: any) => {
        switch (table) {
          case "contraband_items":
            const body = Array.isArray(payload) ? payload[0] : payload
            const created = await api("/contraband-items", { method: "POST", body: JSON.stringify(body) })
            return { data: created }
          case "messages":
            const msgBody = Array.isArray(payload) ? payload[0] : payload
            const msgRes = await api("/messages", { method: "POST", body: JSON.stringify(msgBody) })
            return { data: msgRes }
          case "custody_chain":
            const cc = Array.isArray(payload) ? payload[0] : payload
            const ccRes = await api("/custody/transfers", { method: "POST", body: JSON.stringify({
              contraband_id: cc.contraband_id,
              to_user_id: cc.to_user_id,
              transfer_reason: cc.transfer_reason,
              location: cc.location,
              notes: cc.notes,
            }) })
            return { data: ccRes }
          case "audit_logs":
            // No-op; server logs internally; return success
            return { data: { ok: true } }
          case "evidence_files":
            return { data: { ok: true } }
          default:
            throw new Error(`Unsupported insert table: ${table}`)
        }
      },
      update: (changes: any) => ({
        eq: async (field: string, value: any) => {
          switch (table) {
            case "contraband_items":
              if (field === "id" && changes.status) {
                await api(`/contraband-items/${value}/status`, { method: "PUT", body: JSON.stringify({ status: changes.status }) })
                return { data: { ok: true } }
              }
              return { data: { ok: true } }
            case "messages":
              if (field === "id" && changes.is_read) {
                await api(`/messages/${value}/read`, { method: "PATCH" })
                return { data: { ok: true } }
              }
              return { data: { ok: true } }
            case "users":
              if (field === "id") {
                await api(`/users/${value}`, { method: "PUT", body: JSON.stringify(changes) })
                return { data: { ok: true } }
              }
              return { data: { ok: true } }
            default:
              throw new Error(`Unsupported update for table: ${table}`)
          }
        },
      }),
      eq: async (field: string, value: any) => {
        if (table === "custody_chain" && field === "contraband_id") {
          const data = await api(`/custody/${value}`)
          return { data }
        }
        return { data: [] }
      },
    }
  },
  storage: {
    from(bucket: string) {
      return {
        async upload(path: string, file: File) {
          const form = new FormData()
          form.append("file", file)
          // Extract contraband id from filename prefix if present
          const contrabandId = path.split("_")[0]
          form.append("contraband_id", contrabandId)
          const token = getToken()
          const res = await fetch(`${API_BASE}/files/upload`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            body: form,
          })
          if (!res.ok) throw new Error("Upload failed")
          return { data: { path } }
        },
        getPublicUrl(filePath: string) {
          // Server returns deterministic /files/{filename}. We return the same
          const fileName = filePath.split("/").pop()!
          return { data: { publicUrl: `${API_BASE}/files/${fileName}` } }
        },
      }
    },
  },
}

export const createClient = () => supabase

// Database types
export interface User {
  id: string
  email: string
  full_name: string
  badge_number?: string
  role: "admin" | "supervisor" | "field_officer" | "warehouse_manager" | "auditor"
  department?: string
  phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ContrabandItem {
  id: string
  seizure_number: string
  category_id: string
  item_name: string
  description?: string
  quantity: number
  unit?: string
  estimated_value?: number
  weight_kg?: number
  status: "seized" | "in_custody" | "under_investigation" | "pending_destruction" | "destroyed" | "released"
  seizure_date: string
  seizure_location?: string
  gps_latitude?: number
  gps_longitude?: number
  seized_by: string
  case_number?: string
  court_case_number?: string
  barcode?: string
  rfid_tag?: string
  storage_location?: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  from_user_id: string
  to_user_id: string
  subject?: string
  content: string
  priority: "low" | "normal" | "high" | "urgent"
  message_type: "general" | "approval_request" | "status_update" | "alert"
  contraband_id?: string
  is_read: boolean
  requires_response: boolean
  parent_message_id?: string
  created_at: string
  read_at?: string
}
