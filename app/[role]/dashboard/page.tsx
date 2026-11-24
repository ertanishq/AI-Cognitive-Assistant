import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { LoginRole } from "@/src/views/LoginPage"

type DashboardRouteProps = {
  params: Promise<{ role: string }>
}

const roleLabels: Record<LoginRole, string> = {
  user: "patient",
  caregiver: "caregiver",
  admin: "administrator",
}

function isLoginRole(role: string): role is LoginRole {
  return role === "user" || role === "caregiver" || role === "admin"
}

export const metadata: Metadata = {
  title: "Portal access",
  robots: { index: false, follow: false },
}

export default async function DashboardRoute({ params }: DashboardRouteProps) {
  const { role } = await params

  if (!isLoginRole(role)) {
    notFound()
  }

  return (
    <main className="pending-access">
      <p className="eyebrow">Private portal</p>
      <h1>Dashboard access is not active yet.</h1>
      <p>Secure sign-in and role verification will be connected before dashboard features are enabled.</p>
      <Link className="button button--primary" href={`/login/${role}`}>
        Continue to {roleLabels[role]} sign in
      </Link>
      <Link className="text-link" href="/">Return to Daymark Care</Link>
    </main>
  )
}
