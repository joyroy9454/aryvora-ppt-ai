// ============================================================
// Middleware Helpers — Shared logic for API route protection.
//
// Today: all middleware is permissive (no auth, no rate limits).
// Future: flags control when real protection kicks in.
//
// Usage in API routes:
//   export async function POST(request: NextRequest) {
//     const { allowed, response } = await checkRateLimit(request);
//     if (!allowed) return response!;
//     // ... your route logic
//   }
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { auth, type Session } from "./adapters/auth";
import { isFeatureEnabled } from "./feature-flags";

// ---------- Rate Limiting ----------

interface RateLimitConfig {
  windowMs: number;    // time window in milliseconds
  maxRequests: number; // max requests per window
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,      // 30 requests per minute (generous for free tier)
};

// In-memory store for rate limiting. In production, use Redis.
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check rate limit for a request.
 * Uses IP address as the key for anonymous users.
 *
 * Returns { allowed: true } or { allowed: false, response: NextResponse }
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): Promise<{ allowed: true } | { allowed: false; response: NextResponse }> {
  // If rate limiting feature flag is off, allow all requests
  if (!isFeatureEnabled("credits_system")) {
    return { allowed: true };
  }

  const ip = getClientIp(request);
  const key = `ratelimit:${ip}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return { allowed: true };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait a moment before trying again.",
          retryAfter: Math.ceil((entry.resetAt - now) / 1000),
        },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)) },
        }
      ),
    };
  }

  entry.count++;
  return { allowed: true };
}

// ---------- Auth Middleware ----------

/**
 * Optional auth — returns session if available, null otherwise.
 * Does NOT block the request.
 * Use this for endpoints that work for both anonymous and logged-in users.
 */
export async function optionalAuth(request: NextRequest): Promise<Session | null> {
  if (!isFeatureEnabled("user_accounts")) {
    // No auth system — return anonymous session
    return auth.getSession(request);
  }

  try {
    return await auth.getSession(request);
  } catch {
    return null;
  }
}

/**
 * Require auth — returns session or a NextResponse error.
 * Use this for endpoints that require login.
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ session: Session } | { response: NextResponse }> {
  // If auth feature flag is off, allow anonymous
  if (!isFeatureEnabled("user_accounts")) {
    const session = await auth.getSession(request);
    if (session) return { session };
  }

  try {
    const session = await auth.requireSession(request);
    return { session };
  } catch {
    return {
      response: NextResponse.json(
        { error: "Authentication required. Please sign in." },
        { status: 401 }
      ),
    };
  }
}

// ---------- CORS ----------

/**
 * Add CORS headers to a response.
 * Used by API routes that need cross-origin access (image search, etc.)
 */
export function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

// ---------- Helpers ----------

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

// Clean up old rate limit entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    // Use Array.from to avoid Map iteration issues
    Array.from(rateLimitStore.entries()).forEach(([key, entry]) => {
      if (now > entry.resetAt) rateLimitStore.delete(key);
    });
  }, 5 * 60 * 1000);
}
