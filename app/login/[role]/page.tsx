import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { LoginPage, type LoginRole } from "@/src/views/LoginPage"

type LoginRouteProps = {
  params: Promise<{ role: string }>
}

const roleTitles: Record<LoginRole, string> = {
  user: "User sign in",
  caregiver: "Caregiver sign in",
  admin: "Administrator sign in",
}

function isLoginRole(role: string): role is LoginRole {
  return role === "user" || role === "caregiver" || role === "admin"
}

export async function generateMetadata({ params }: LoginRouteProps): Promise<Metadata> {
  const { role } = await params
  return { title: isLoginRole(role) ? roleTitles[role] : "Account sign in" }
}

export default async function LoginRoute({ params }: LoginRouteProps) {
  const { role } = await params

  if (!isLoginRole(role)) {
    notFound()
  }

  return <LoginPage role={role} />
}
