import type { ReactNode } from "react"
import "../globals.css"

export const metadata = {
  title: "Sentient AI - Advanced Reasoning Chatbot",
  description:
    "Experience the power of advanced reasoning and contextual understanding with our next-generation AI chatbot.",
  generator: "v0.dev",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
