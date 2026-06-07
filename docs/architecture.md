# Architecture Overview

## Current Phase: MVP (No Auth, No DB, No Payments)

```
┌─────────────────────────────────────────────────┐
│                  Next.js App                      │
│                                                   │
│  ┌─────────────┐  ┌──────────────┐               │
│  │   Frontend   │  │  API Routes   │               │
│  │  (page.tsx   │  │  (/api/*)    │               │
│  │  SlideEditor)│  │              │               │
│  └──────┬───────┘  └──────┬───────┘               │
│         │                  │                       │
│  ┌──────┴──────────────────┴───────┐              │
│  │         Lib Layer               │              │
│  │  ┌─────────┐  ┌──────────────┐  │              │
│  │  │ai-engine│  │  constants   │  │              │
│  │  └─────────┘  └──────────────┘  │              │
│  │  ┌──────────────────────────┐   │              │
│  │  │  Adapters (Future-Ready) │   │              │
│  │  │  ┌──────┐ ┌────┐ ┌────┐ │   │              │
│  │  │  │storage│ │auth│ │pay │ │   │              │
│  │  │  └──────┘ └────┘ └────┘ │   │              │
│  │  └──────────────────────────┘   │              │
│  │  ┌──────────────────────────┐   │              │
│  │  │  Feature Flags           │   │              │
│  │  │  Middleware Helpers      │   │              │
│  │  └──────────────────────────┘   │              │
│  └─────────────────────────────────┘              │
│                                                   │
│  External: OpenRouter AI (PPT generation)         │
│            Picsum/Unsplash (stock photos)         │
│            pptxgenjs (PPTX export)                │
└─────────────────────────────────────────────────┘
```

## Adapter Pattern

All external dependencies are abstracted behind adapter interfaces:

| Adapter | Current Implementation | Future Implementation |
|---------|----------------------|----------------------|
| **Storage** | `NoopStorageAdapter` (in-memory) | Prisma + PostgreSQL |
| **Auth** | `AnonymousAuthAdapter` (no auth) | NextAuth / Clerk |
| **Payments** | `FreePaymentAdapter` (all free) | Stripe / LemonSqueezy |

### How to swap an adapter:

```typescript
// Today (in src/lib/adapters/storage.ts):
export const storage = new NoopStorageAdapter();

// Future (just change this line):
export const storage = new PrismaStorageAdapter(prisma);
```

Zero changes needed in business logic — all code uses the `StorageAdapter` interface.

## Feature Flags

New features are gated behind feature flags in `src/lib/feature-flags.ts`:

```typescript
// In API routes or components:
if (isFeatureEnabled("saved_projects", { userId, plan })) {
  // Show save button, enable project management
}

if (isFeatureEnabled("user_accounts")) {
  // Show login/signup UI
}
```

### Rollout strategies:
- **Global on/off**: `enabled: true/false`
- **Plan-based**: `allowedPlans: ["pro", "team"]`
- **User-based**: `allowedUsers: ["user-id-1"]` (beta testers)
- **Percentage**: `rolloutPercentage: 10` (10% of users)

## API Route Structure

```
/api
├── generate/           # Main generation endpoint
├── regenerate-slide/   # Single slide regeneration
├── fetch-url/          # URL content extraction
├── search-images/      # Free stock photo search
├── generate-image/     # Single image URL
├── export/
│   ├── pptx/           # PowerPoint export
│   ├── pdf/            # PDF export
│   ├── markdown/       # Markdown export
│   └── notes/          # Speaker notes export
└── editor/
    ├── regenerate-deck/  # Full deck regeneration
    └── change-template/  # Template change
```

## Middleware Pipeline (Future)

When auth is enabled, API routes will use:

```typescript
// Optional auth (works for both anonymous and logged-in):
const session = await optionalAuth(request);

// Required auth (blocks anonymous):
const { session, response } = await requireAuth(request);
if (response) return response;

// Rate limiting:
const { allowed, response } = await checkRateLimit(request);
if (!allowed) return response;
```

## Folder Structure (Current + Future)

```
src/
├── app/
│   ├── page.tsx              # Landing + Editor
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   ├── api/                  # API routes (all server-side)
│   │   ├── generate/
│   │   ├── regenerate-slide/
│   │   ├── fetch-url/
│   │   ├── search-images/
│   │   ├── generate-image/
│   │   ├── export/
│   │   └── editor/
│   ├── (auth)/               # FUTURE: Auth pages (login, signup)
│   ├── dashboard/            # FUTURE: User dashboard
│   ├── projects/             # FUTURE: Saved projects
│   ├── pricing/              # FUTURE: Pricing page
│   ├── share/[slug]/         # FUTURE: Public shared decks
│   └── [seo-pages]           # SEO landing pages
├── components/
│   ├── SlideEditor.tsx       # Main slide editor
│   └── SEOPageTemplate.tsx   # Reusable SEO page
├── lib/
│   ├── ai-engine.ts          # AI intelligence layer
│   ├── constants.ts          # Shared constants
│   ├── feature-flags.ts      # Feature flag system
│   ├── middleware.ts         # Auth/rate-limit helpers
│   └── adapters/
│       ├── storage.ts        # Storage adapter (Noop → Prisma)
│       ├── auth.ts           # Auth adapter (Anonymous → NextAuth)
│       └── payment.ts        # Payment adapter (Free → Stripe)
├── types.ts                  # All TypeScript types
└── docs/
    ├── architecture.md       # This file
    └── database-schema.md    # Database schema design
```

## Key Design Decisions

1. **No premature abstraction**: Adapters are simple interfaces with working no-op implementations. No complex dependency injection.

2. **Feature flags over branches**: New features are developed behind flags, not in separate branches. This keeps main always deployable.

3. **JSONB for flexible data**: Slide content is stored as JSONB in the database schema, matching the current in-memory structure. No migration needed when adding new slide types.

4. **Adapter singletons**: Each adapter is a module-level singleton. Swap the implementation, not the usage.

5. **Middleware helpers, not Next.js middleware.ts**: Using helper functions (not Next.js middleware) keeps things simple and testable. Can migrate to Next.js middleware later.
