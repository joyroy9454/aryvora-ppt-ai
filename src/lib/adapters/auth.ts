// ============================================================
// Auth Adapter — Abstraction layer for authentication.
//
// Today: no authentication (anonymous usage).
// Future: swap in NextAuth/Clerk/Auth0 by implementing
//   this interface — zero changes to API routes.
// ============================================================

// ---------- User types ----------

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  plan: "free" | "pro" | "team" | "enterprise";
  createdAt: string; // ISO
}

export interface Session {
  user: User;
  expiresAt: string; // ISO
}

// ---------- Auth adapter interface ----------

export interface AuthAdapter {
  /** Get the current session from the request */
  getSession(request: Request): Promise<Session | null>;

  /** Require a session — returns session or throws */
  requireSession(request: Request): Promise<Session>;

  /** Check if a user has a specific permission */
  hasPermission(user: User, permission: Permission): boolean;

  /** Check if a user has reached their usage limit */
  checkLimit(user: User, action: LimitAction): { allowed: boolean; remaining: number };
}

// ---------- Permissions ----------

export type Permission =
  | "project:create"
  | "project:read"
  | "project:update"
  | "project:delete"
  | "project:share"
  | "export:pptx"
  | "export:pdf"
  | "export:markdown"
  | "team:invite"
  | "team:manage"
  | "analytics:view";

export type LimitAction = "generate" | "export" | "project_create";

// ---------- Current implementation: anonymous (no-auth) ----------

/**
 * AnonymousAuthAdapter — the default implementation.
 *
 * All requests are treated as anonymous users with full access.
 * When you add real auth:
 *  1. Create a new adapter (e.g., NextAuthAdapter)
 *  2. Swap it in the factory
 *  3. All API routes automatically get auth
 */
export class AnonymousAuthAdapter implements AuthAdapter {
  private anonymousUser: User = {
    id: "anon",
    email: "anonymous@aryvora.local",
    name: "Anonymous",
    avatarUrl: null,
    plan: "free",
    createdAt: new Date().toISOString(),
  };

  async getSession(_request: Request): Promise<Session | null> {
    return {
      user: this.anonymousUser,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
    };
  }

  async requireSession(_request: Request): Promise<Session> {
    return this.getSession(_request) as Promise<Session>;
  }

  hasPermission(_user: User, _permission: Permission): boolean {
    return true; // anonymous users have all permissions
  }

  checkLimit(_user: User, _action: LimitAction): { allowed: boolean; remaining: number } {
    return { allowed: true, remaining: 999 }; // unlimited
  }
}

// Singleton — swap this out when you add real auth
export const auth = new AnonymousAuthAdapter();
