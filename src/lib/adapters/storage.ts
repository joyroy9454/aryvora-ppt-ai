// ============================================================
// Storage Adapter — Abstraction layer for data persistence.
//
// Today: all data is ephemeral (no database).
// Future: swap in Prisma/Drizzle/Supabase by implementing
//   this interface — zero changes to business logic.
// ============================================================

import type { Slide, AIAnalysis, InputMode } from "@/types";

// ---------- Core data types ----------

export interface SavedProject {
  id: string;
  userId: string;
  title: string;
  slides: Slide[];
  analysis: AIAnalysis | null;
  templateId: string;
  inputMode: InputMode;
  inputText: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  isPublic: boolean;
  shareSlug: string | null;
}

export interface CreateProjectInput {
  userId: string;
  title: string;
  slides: Slide[];
  analysis?: AIAnalysis | null;
  templateId?: string;
  inputMode?: InputMode;
  inputText?: string;
}

export interface UpdateProjectInput {
  title?: string;
  slides?: Slide[];
  analysis?: AIAnalysis | null;
  templateId?: string;
  isPublic?: boolean;
}

// ---------- Storage adapter interface ----------

export interface StorageAdapter {
  // Projects
  createProject(input: CreateProjectInput): Promise<SavedProject>;
  getProject(id: string): Promise<SavedProject | null>;
  getUserProjects(userId: string, limit?: number, offset?: number): Promise<SavedProject[]>;
  updateProject(id: string, input: UpdateProjectInput): Promise<SavedProject | null>;
  deleteProject(id: string): Promise<boolean>;
  getProjectBySlug(slug: string): Promise<SavedProject | null>;

  // Usage tracking (for credits/limits)
  getUserUsage(userId: string): Promise<UserUsage>;
  incrementUsage(userId: string, action: UsageAction): Promise<UserUsage>;
}

// ---------- Usage & credits ----------

export type UsageAction = "generate" | "export" | "regenerate";

export interface UserUsage {
  userId: string;
  totalGenerations: number;
  totalExports: number;
  creditsRemaining: number;
  billingPeriodStart: string; // ISO
  billingPeriodEnd: string; // ISO
  plan: "free" | "pro" | "team" | "enterprise";
}

// ---------- Current implementation: in-memory (no-op) ----------

/**
 * NoopStorageAdapter — the default implementation.
 *
 * All methods return sensible defaults or throw "not implemented".
 * This lets us:
 *  1. Write future code that calls storage APIs without crashing
 *  2. Swap in a real adapter by changing one line in a factory
 *  3. Test business logic without a database
 */
export class NoopStorageAdapter implements StorageAdapter {
  async createProject(input: CreateProjectInput): Promise<SavedProject> {
    const now = new Date().toISOString();
    return {
      id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: input.userId,
      title: input.title,
      slides: input.slides,
      analysis: input.analysis ?? null,
      templateId: input.templateId ?? "corporate",
      inputMode: input.inputMode ?? "topic",
      inputText: input.inputText ?? "",
      createdAt: now,
      updatedAt: now,
      isPublic: false,
      shareSlug: null,
    };
  }

  async getProject(_id: string): Promise<SavedProject | null> {
    return null;
  }

  async getUserProjects(_userId: string, _limit = 20, _offset = 0): Promise<SavedProject[]> {
    return [];
  }

  async updateProject(id: string, input: UpdateProjectInput): Promise<SavedProject | null> {
    return {
      id,
      userId: "",
      title: input.title ?? "",
      slides: input.slides ?? [],
      analysis: input.analysis ?? null,
      templateId: input.templateId ?? "corporate",
      inputMode: "topic",
      inputText: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: false,
      shareSlug: null,
    };
  }

  async deleteProject(_id: string): Promise<boolean> {
    return true;
  }

  async getProjectBySlug(_slug: string): Promise<SavedProject | null> {
    return null;
  }

  async getUserUsage(userId: string): Promise<UserUsage> {
    const now = new Date();
    return {
      userId,
      totalGenerations: 0,
      totalExports: 0,
      creditsRemaining: 999, // unlimited in no-auth mode
      billingPeriodStart: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      billingPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
      plan: "free",
    };
  }

  async incrementUsage(userId: string, _action: UsageAction): Promise<UserUsage> {
    const usage = await this.getUserUsage(userId);
    return { ...usage, totalGenerations: usage.totalGenerations + 1 };
  }
}

// Singleton — swap this out when you add a real database
export const storage = new NoopStorageAdapter();
