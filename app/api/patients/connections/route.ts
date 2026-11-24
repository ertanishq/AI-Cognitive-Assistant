import { NextResponse } from "next/server"
import { memoryStore } from "@/src/server/db/store"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")
    const caregiverId = searchParams.get("caregiverId")

    if (patientId) {
      const connections = memoryStore.getConnectionsForPatient(patientId)
      return NextResponse.json({ connections })
    }

    if (caregiverId) {
      const connections = memoryStore.getConnectionsForCaregiver(caregiverId)
      return NextResponse.json({ connections })
    }

    return NextResponse.json({ error: "patientId or caregiverId parameter required." }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { caregiverId, targetPatientIdentifier, relationship, additionalNote } = body

    if (!caregiverId || !targetPatientIdentifier || !relationship) {
      return NextResponse.json({
        error: "caregiverId, targetPatientIdentifier and relationship are required.",
      }, { status: 400 })
    }

    const connection = memoryStore.createConnectionRequest(
      caregiverId,
      targetPatientIdentifier,
      relationship,
      additionalNote
    )

    return NextResponse.json({
      success: true,
      connection,
      message: "Connection request submitted. It will remain Pending until approved by the patient.",
    }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
