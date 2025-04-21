/**
 * Get server-side only environment variables
 * These will never be exposed to the client
 */
export function getServerEnv() {
  // For server components/API routes
  if (typeof process !== "undefined" && process.env) {
    return {
      // Server-only environment variables
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || "",
    };
  }

  // Fallback for edge case - should never happen on client
  console.error(
    "Attempted to access server environment variables from client!",
  );
  return {
    GOOGLE_API_KEY: "",
  };
}

/**
 * Validate if running in server context
 * Use this to ensure code that accesses server-only variables only runs server-side
 */
export function isServer(): boolean {
  return typeof window === "undefined";
}
