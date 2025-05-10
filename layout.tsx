import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import LayoutWrapper from "./layout-wrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Sentient AI - Advanced Reasoning Chatbot",
  description:
    "Experience the power of advanced reasoning and contextual understanding with our next-generation AI chatbot.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <LayoutWrapper>{children}</LayoutWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}

