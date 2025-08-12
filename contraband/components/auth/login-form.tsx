"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Shield } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { signIn } from "@/lib/actions"
import Image from "next/image"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-slate-700 hover:bg-slate-600 text-white py-6 text-lg font-medium rounded-lg h-[60px]"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        <>
          <Shield className="mr-2 h-4 w-4" />
          Sign In
        </>
      )}
    </Button>
  )
}

export default function LoginForm() {
  const router = useRouter()
  const [state, formAction] = useActionState(signIn, null)

  // Handle successful login by redirecting
  useEffect(() => {
    if (state?.success) {
      router.push("/")
    }
  }, [state, router])

  return (
    <Card className="w-full max-w-md bg-slate-800 border-slate-700">
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center gap-4">
          <Image
            src="/images/efp-logo.png"
            alt="Ethiopian Federal Police"
            width={60}
            height={60}
            className="rounded-full"
          />
          <Image
            src="/images/customs-logo.png"
            alt="Customs Commission"
            width={60}
            height={60}
            className="rounded-full"
          />
        </div>
        <CardTitle className="text-2xl font-serif text-white">Ethiopian Federal Police</CardTitle>
        <p className="text-slate-300">Contraband Management System</p>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded">{state.error}</div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="officer@police.gov.et"
                required
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <SubmitButton />

          <div className="text-center text-slate-400">
            Need an account?{" "}
            <Link href="/auth/sign-up" className="text-white hover:underline">
              Contact your administrator
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
