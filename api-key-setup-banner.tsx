"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Check, Key } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getApiClient } from "@/lib/api-client"

interface ApiKeySetupBannerProps {
  onApiKeyUpdated: () => void
}

export default function ApiKeySetupBanner({ onApiKeyUpdated }: ApiKeySetupBannerProps) {
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
      // Store the API key in localStorage
      localStorage.setItem("TOGETHER_API_KEY", apiKey)

      // Also store in a cookie for server-side access
      document.cookie = `TOGETHER_API_KEY=${apiKey}; path=/; max-age=31536000; SameSite=Strict`

      // Update the API client
      const apiClient = getApiClient()
      apiClient.setApiKey(apiKey)
      apiClient.resetAuthError()

      // Test the API key with a simple request
      const response = await fetch("/api/test-api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey, // Pass the key in headers too
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

      // Notify parent component
      onApiKeyUpdated()
    } catch (err) {
      console.error("Error setting up API key:", err)
      setError(err instanceof Error ? err.message : "Failed to set up API key")

      // Clear invalid API key
      localStorage.removeItem("TOGETHER_API_KEY")
      document.cookie = "TOGETHER_API_KEY=; path=/; max-age=0"
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50 mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <Key className="h-5 w-5" />
          API Key Required
        </CardTitle>
        <CardDescription className="text-amber-700">
          Please enter your Together.ai API key to enable the chatbot functionality
        </CardDescription>
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
                <label htmlFor="apiKey" className="text-sm font-medium text-amber-800">
                  API Key
                </label>
                <a
                  href="https://api.together.xyz/settings/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-800 hover:underline"
                >
                  Get API key from Together.ai
                </a>
              </div>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your Together.ai API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="border-amber-300 bg-white"
              />
              <p className="text-xs text-amber-700">
                Your API key is stored locally in your browser and is never sent to our servers.
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
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSubmitting ? "Validating..." : "Save API Key"}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

