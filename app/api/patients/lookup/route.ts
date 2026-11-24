import { NextResponse } from "next/server"
import { memoryStore } from "@/src/server/db/store"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const identifier = searchParams.get("identifier")

    if (!identifier || !identifier.trim()) {
      return NextResponse.json({ error: "Patient identifier is required." }, { status: 400 })
    }

    const match = memoryStore.findPatientByIdOrEmail(identifier)

    if (!match) {
      return NextResponse.json({
        found: false,
        message: "No patient registered with this Patient ID or email address.",
      }, { status: 404 })
    }

    // Security rule: Never expose medical history, address, or sensitive profile details!
    return NextResponse.json({
      found: true,
      patientId: match.user.patientId,
      patientName: match.user.fullName,
      maskedEmail: match.user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3"),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
