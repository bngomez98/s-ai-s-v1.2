import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Clone the request headers
  const requestHeaders = new Headers(request.headers)

  // Only add the API key for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // Get the API key from the cookie (if it exists)
    const apiKey = request.cookies.get("TOGETHER_API_KEY")?.value

    if (apiKey) {
      // Add the API key to the request headers
      requestHeaders.set("x-api-key", apiKey)
    }
  }

  // Return the response with the modified headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: "/api/:path*",
}

