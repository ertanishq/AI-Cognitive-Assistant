import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SignUpPage } from "@/src/views/SignUpPage"
import type { SignUpRole } from "@/src/types/signup"

type SignUpRouteProps = {
  params: Promise<{ role: string }>
}

const roleTitles: Record<SignUpRole, string> = {
  user: "Patient Registration",
  caregiver: "Caregiver Registration",
}

function isSignUpRole(role: string): role is SignUpRole {
  return role === "user" || role === "caregiver"
}

export async function generateMetadata({ params }: SignUpRouteProps): Promise<Metadata> {
  const { role } = await params
  return {
    title: isSignUpRole(role) ? roleTitles[role] : "Account Registration",
    description:
      role === "user"
        ? "Register as a patient to access gentle cognitive exercises, memory assistance and care coordination."
        : "Register as a caregiver to support your loved ones and coordinate everyday care on Daymark Care.",
  }
}

export default async function SignUpRoute({ params }: SignUpRouteProps) {
  const { role } = await params

  // Admin registration is strictly forbidden
  if (!isSignUpRole(role)) {
    notFound()
  }

  return <SignUpPage role={role} />
}
