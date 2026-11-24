import { NextResponse } from "next/server"
import { memoryStore } from "@/src/server/db/store"
import type { ConnectionStatus } from "@/src/server/models/connection"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { status } = body as { status: ConnectionStatus }

    const validStatuses: ConnectionStatus[] = ["Pending", "Approved", "Rejected", "Revoked"]
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      }, { status: 400 })
    }

    const updated = memoryStore.updateConnectionStatus(id, status)

    return NextResponse.json({
      success: true,
      connection: updated,
      message: `Connection status updated to ${status}.`,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
