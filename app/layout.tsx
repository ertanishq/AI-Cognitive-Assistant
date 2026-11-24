import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import "../src/styles.css"

export const metadata: Metadata = {
  title: {
    default: "Daymark Care — Cognitive wellbeing, every day",
    template: "%s | Daymark Care",
  },
  description:
    "Daymark Care offers approachable cognitive activities, daily memory assistance and caregiver support for everyday wellbeing.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f8f4",
  colorScheme: "light",
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
