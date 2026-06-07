// ============================================================
// Feature Flags — Gradual rollout system for new features.
//
// Today: all features are enabled for everyone.
// Future: use flags to control rollout per user, plan, or percentage.
//
// Usage in code:
//   if (features.isEnabled("saved_projects", { userId })) { ... }
// ============================================================

export interface FeatureContext {
  userId?: string;
  plan?: string;
  email?: string;
}

export interface FeatureFlag {
  name: string;
  description: string;
  enabled: boolean;                        // global on/off
  rolloutPercentage?: number;              // 0-100, for gradual rollout
  allowedPlans?: string[];                 // only for specific plans
  allowedUsers?: string[];                  // allowed list (beta testers)
}

// ---------- Feature flag definitions ----------

/**
 * Registry of all feature flags.
 *
 * Add new features here. The flag system reads from this registry.
 * In the future, this could be backed by a database or remote config.
 */
export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // Phase 7+ — Future features (all disabled by default)
  saved_projects: {
    name: "saved_projects",
    description: "Allow users to save and manage presentations",
    enabled: false,
    rolloutPercentage: 0,
    allowedPlans: ["pro", "team", "enterprise"],
  },
  user_accounts: {
    name: "user_accounts",
    description: "Enable user registration and login",
    enabled: false,
    rolloutPercentage: 0,
  },
  collaboration: {
    name: "collaboration",
    description: "Real-time collaboration on presentations",
    enabled: false,
    allowedPlans: ["team", "enterprise"],
  },
  sharing: {
    name: "sharing",
    description: "Share presentations via public links",
    enabled: false,
    rolloutPercentage: 0,
    allowedPlans: ["pro", "team", "enterprise"],
  },
  team_workspace: {
    name: "team_workspace",
    description: "Team workspaces with shared presentations",
    enabled: false,
    allowedPlans: ["team", "enterprise"],
  },
  analytics: {
    name: "analytics",
    description: "Usage analytics and deck performance tracking",
    enabled: false,
    allowedPlans: ["pro", "team", "enterprise"],
  },
  credits_system: {
    name: "credits_system",
    description: "Track and limit AI generation credits",
    enabled: false,
  },
  subscriptions: {
    name: "subscriptions",
    description: "Paid subscription plans",
    enabled: false,
  },

  // Current features (always enabled)
  pptx_export: {
    name: "pptx_export",
    description: "Export presentations as PPTX files",
    enabled: true,
  },
  pdf_export: {
    name: "pdf_export",
    description: "Export presentations as PDF files",
    enabled: true,
  },
  image_search: {
    name: "image_search",
    description: "Search and use free stock photos",
    enabled: true,
  },
  speaker_notes: {
    name: "speaker_notes",
    description: "Generate speaker notes for slides",
    enabled: true,
  },
  fullscreen_present: {
    name: "fullscreen_present",
    description: "Fullscreen presentation mode",
    enabled: true,
  },
};

// ---------- Feature flag checker ----------

export function isFeatureEnabled(flagName: string, context?: FeatureContext): boolean {
  const flag = FEATURE_FLAGS[flagName];
  if (!flag) return false;
  if (!flag.enabled) return false;

  // If specific users are allowed, check first
  if (flag.allowedUsers?.length && context?.userId) {
    if (flag.allowedUsers.includes(context.userId)) return true;
  }

  // If plan restrictions exist, check plan
  if (flag.allowedPlans?.length && context?.plan) {
    if (!flag.allowedPlans.includes(context.plan)) return false;
  }

  // If no restrictions, feature is enabled globally
  if (!flag.allowedUsers?.length && !flag.allowedPlans?.length) {
    return true;
  }

  // Rollout percentage (deterministic by user id)
  if (flag.rolloutPercentage !== undefined && context?.userId) {
    const hash = hashString(context.userId);
    return (hash % 100) < flag.rolloutPercentage;
  }

  return false;
}

/**
 * Helper to check if a feature exists in the registry
 * (even if disabled). Useful for UI that shows "coming soon" features.
 */
export function featureExists(flagName: string): boolean {
  return flagName in FEATURE_FLAGS;
}

/**
 * Get all enabled features for a given context
 */
export function getEnabledFeatures(context?: FeatureContext): string[] {
  return Object.keys(FEATURE_FLAGS).filter((name) => isFeatureEnabled(name, context));
}

// Simple hash for consistent percentage rollout
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}
