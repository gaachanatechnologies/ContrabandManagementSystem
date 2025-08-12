"use server"

import { cookies } from "next/headers"

export async function signIn(prevState: any, formData: FormData) {
  if (!formData) return { error: "Form data is missing" }
  const email = formData.get("email")?.toString()
  const password = formData.get("password")?.toString()
  if (!email || !password) return { error: "Email and password are required" }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    })
    if (!res.ok) {
      const t = await res.text()
      return { error: t || "Invalid credentials" }
    }
    const data = await res.json()
    const token = data.token
    if (!token) return { error: "Invalid response from server" }

    // Store token in cookie (readable client-side for API shim)
    const cookieStore = cookies()
    cookieStore.set("token", token, { path: "/", httpOnly: false, sameSite: "lax" })
    return { success: true }
  } catch (e) {
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signUp(prevState: any, formData: FormData) {
  if (!formData) return { error: "Form data is missing" }
  const email = formData.get("email")?.toString()
  const password = formData.get("password")?.toString()
  const fullName = formData.get("fullName")?.toString()
  const badgeNumber = formData.get("badgeNumber")?.toString()
  const role = formData.get("role")?.toString() || "field_officer"
  const department = formData.get("department")?.toString()
  if (!email || !password || !fullName) return { error: "Email, password, and full name are required" }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName, role, badgeNumber, department }),
      cache: "no-store",
    })
    if (!res.ok) {
      const t = await res.text()
      return { error: t || "Failed to create user" }
    }
    return { success: "Account created. You can sign in now." }
  } catch (e) {
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signOut() {
  const cookieStore = cookies()
  cookieStore.delete("token")
  return { success: true }
}
