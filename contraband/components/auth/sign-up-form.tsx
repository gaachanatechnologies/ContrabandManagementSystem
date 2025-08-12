"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, UserPlus } from "lucide-react"
import Link from "next/link"
import { signUp } from "@/lib/actions"
import Image from "next/image"
import { useState } from "react"

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
          Creating Account...
        </>
      ) : (
        <>
          <UserPlus className="mr-2 h-4 w-4" />
          Create Account
        </>
      )}
    </Button>
  )
}

export default function SignUpForm() {
  const [state, formAction] = useActionState(signUp, null)
  const [selectedRole, setSelectedRole] = useState("")

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
        <CardTitle className="text-2xl font-serif text-white">Create Officer Account</CardTitle>
        <p className="text-slate-300">Register for system access</p>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded">{state.error}</div>
          )}

          {state?.success && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded">
              {state.success}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-300">
                Full Name *
              </Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Officer Tadesse Bekele"
                required
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                Email Address *
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
              <Label htmlFor="badgeNumber" className="text-slate-300">
                Badge Number
              </Label>
              <Input
                id="badgeNumber"
                name="badgeNumber"
                type="text"
                placeholder="EFP-2024-001"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-slate-300">
                Role *
              </Label>
              <Select name="role" value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="field_officer">Field Officer</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="warehouse_manager">Warehouse Manager</SelectItem>
                  <SelectItem value="auditor">Auditor</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department" className="text-slate-300">
                Department
              </Label>
              <Input
                id="department"
                name="department"
                type="text"
                placeholder="e.g., Narcotics Division"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Password *
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
            Already have an account?{" "}
            <Link href="/auth/login" className="text-white hover:underline">
              Sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
