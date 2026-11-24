import { NextResponse } from "next/server"
import crypto from "node:crypto"

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
  "audio/webm",
  "audio/wav",
  "audio/ogg",
  "audio/mp3",
  "audio/mpeg",
])

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB max

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, size, type, dataUrl } = body

    if (!name || !size || !type) {
      return NextResponse.json({ error: "Missing required file metadata (name, size, type)." }, { status: 400 })
    }

    if (size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File exceeds the maximum allowed size of 10MB." }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.has(type.toLowerCase())) {
      return NextResponse.json({
        error: `Unsupported file type (${type}). Allowed types are JPEG, PNG, WebP, PDF, and audio recordings.`,
      }, { status: 400 })
    }

    const fileMeta = {
      id: `file_${crypto.randomUUID()}`,
      name: name.replace(/[^\w.-]/g, "_"),
      size,
      type,
      dataUrl: dataUrl || undefined,
      uploadedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      file: fileMeta,
      message: "File verified and accepted.",
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
