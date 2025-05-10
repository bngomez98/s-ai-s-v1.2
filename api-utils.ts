export function handleApiError(error: any): string {
  if (error instanceof Error) {
    // Extract the most relevant part of the error message
    const message = error.message

    // Check for common API error patterns
    if (message.includes("API key")) {
      return "Invalid or missing API key. Please check your API key configuration."
    }

    if (message.includes("rate limit") || message.includes("429")) {
      return "Rate limit exceeded. Please try again in a few moments."
    }

    if (message.includes("timeout") || message.includes("timed out")) {
      return "Request timed out. The server took too long to respond."
    }

    if (message.includes("network") || message.includes("ECONNREFUSED") || message.includes("ENOTFOUND")) {
      return "Network error. Please check your internet connection."
    }

    if (message.includes("500") || message.includes("502") || message.includes("503") || message.includes("504")) {
      return "Server error. The AI service is currently experiencing issues."
    }

    // Return the original error message if no specific pattern is matched
    return message
  }

  // Fallback for non-Error objects
  return "An unexpected error occurred. Please try again."
}

