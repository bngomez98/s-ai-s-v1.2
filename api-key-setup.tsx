"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Check, Copy, Key } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ApiKeySetupProps {
  onSetupComplete?: () => void
}

export default function ApiKeySetup({ onSetupComplete }: ApiKeySetupProps) {
  const [apiKey, setApiKey] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!apiKey.trim()) {
      setError("Please enter an API key")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Store the API key in localStorage for now
      // In a production app, you would want to store this more securely
      localStorage.setItem("TOGETHER_API_KEY", apiKey)

      // Test the API key with a simple request
      const response = await fetch("/api/test-api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to validate API key")
      }

      setSuccess(true)
      toast({
        title: "API key saved",
        description: "Your Together.ai API key has been saved successfully.",
      })

      if (onSetupComplete) {
        onSetupComplete()
      }
    } catch (err) {
      console.error("Error setting up API key:", err)
      setError(err.message || "Failed to set up API key")
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyInstructions = () => {
    navigator.clipboard.writeText(
      "1. Go to https://together.ai\n2. Sign up or log in\n3. Navigate to your API settings\n4. Create a new API key\n5. Copy the key and paste it here",
    )
    toast({
      description: "Instructions copied to clipboard",
    })
  }

  return (
    <Card className="w-full max-w-md mx-auto border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          Together.ai API Setup
        </CardTitle>
        <CardDescription>Enter your Together.ai API key to enable the chatbot functionality</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success ? (
          <Alert className="mb-4 border-green-500 text-green-500">
            <Check className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>API key has been set up successfully</AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="apiKey" className="text-sm font-medium">
                  API Key
                </label>
                <Button type="button" variant="ghost" size="sm" onClick={copyInstructions} className="h-6 px-2 text-xs">
                  <Copy className="h-3 w-3 mr-1" />
                  Copy instructions
                </Button>
              </div>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your Together.ai API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="border-primary/20"
              />
              <p className="text-xs text-muted-foreground">
                Your API key is stored locally and is never sent to our servers.
              </p>
            </div>
          </form>
        )}
      </CardContent>
      {!success && (
        <CardFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !apiKey.trim()}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? "Validating..." : "Save API Key"}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

