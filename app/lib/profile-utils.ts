/**
 * Get the base URL for the application
 * In development, uses localhost:3000
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    // Client-side: use current origin
    return window.location.origin;
  }

  // Server-side: use environment variable or default
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // Default to localhost in development
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  // Production default
  return "https://FYNEX.com";
}

/**
 * Generate a profile link for a user
 * @param userId - The user ID (UUID)
 * @returns Full URL to the user's profile
 */
export function getProfileLink(userId: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/profile/${userId}`;
}

/**
 * Generate a profile link from display name (legacy, for backward compatibility)
 * @param displayName - The user's display name
 * @returns Full URL to the user's profile (using slug)
 */
export function getProfileLinkFromName(displayName: string): string {
  const baseUrl = getBaseUrl();
  const slug = displayName.replace(/\s+/g, "-").toLowerCase();
  return `${baseUrl}/profile/${slug}`;
}


