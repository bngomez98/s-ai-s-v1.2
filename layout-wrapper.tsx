"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { AuthProvider } from "@/lib/auth-context"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ConversationProvider } from "@/lib/conversation-context"
import { Loader2 } from "lucide-react"

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="animate-spin">
          <Loader2 className="h-8 w-8 text-primary" />
        </div>
        <p className="mt-4 text-muted-foreground">Initializing application...</p>
      </div>
    )
  }

  return (
    <AuthProvider>
      <ConversationProvider>
        <SidebarProvider>{children}</SidebarProvider>
      </ConversationProvider>
    </AuthProvider>
  )
}

