# Database Schema Design

> **Status:** Design only — not implemented yet.
> **When to implement:** When `user_accounts` feature flag is enabled.
> **Recommended stack:** PostgreSQL + Prisma ORM (or Drizzle for lighter weight)

---

## Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    users      │     │  presentations    │     │  subscriptions   │
├──────────────┤     ├──────────────────┤     ├─────────────────┤
│ id (PK)      │◄────│ user_id (FK)     │     │ user_id (FK)    │
│ email (UQ)   │     │ id (PK)          │     │ id (PK)         │
│ name         │     │ title            │     │ plan_id (FK)    │
│ avatar_url   │     │ template_id      │     │ status          │
│ plan_id (FK) │     │ input_mode       │     │ period_start    │
│ created_at   │     │ input_text       │     │ period_end      │
│ updated_at   │     │ is_public        │     │ cancel_at_end   │
└──────────────┘     │ share_slug (UQ)  │     └────────┬────────┘
                     │ created_at       │              │
                     │ updated_at       │              │
                     └────────┬─────────┘              │
                              │                        │
                     ┌────────┴─────────┐     ┌───────┴────────┐
                     │  slides           │     │  plans          │
                     ├──────────────────┤     ├────────────────┤
                     │ id (PK)          │     │ id (PK)        │
                     │ presentation_id  │     │ name           │
                     │ type             │     │ price_monthly  │
                     │ heading          │     │ price_yearly   │
                     │ sub              │     │ limits (JSON)  │
                     │ content (JSON)   │     │ features(JSON) │
                     │ position         │     └────────────────┘
                     │ created_at       │
                     └──────────────────┘

┌──────────────┐     ┌──────────────────┐
│  team_members │     │  usage_logs       │
├──────────────┤     ├──────────────────┤
│ team_id (FK) │     │ user_id (FK)     │
│ user_id (FK) │     │ action           │
│ role         │     │ metadata (JSON)  │
│ joined_at    │     │ created_at       │
└──────────────┘     └──────────────────┘

┌──────────────┐
│  teams        │
├──────────────┤
│ id (PK)      │
│ name         │
│ owner_id(FK) │
│ created_at   │
└──────────────┘
```

---

## Table Definitions

### users
```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  name        VARCHAR(255),
  avatar_url  TEXT,
  plan_id     VARCHAR(50) DEFAULT 'free',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

### plans
```sql
CREATE TABLE plans (
  id              VARCHAR(50) PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  price_monthly   INTEGER DEFAULT 0,  -- cents
  price_yearly    INTEGER DEFAULT 0,  -- cents
  limits          JSONB NOT NULL,     -- { presentationsPerMonth, slidesPerPresentation, ... }
  features        JSONB NOT NULL,     -- [{ name, included, value }]
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO plans (id, name, price_monthly, price_yearly, limits, features) VALUES
('free', 'Free', 0, 0,
  '{"presentationsPerMonth": 10, "slidesPerPresentation": 25, "exportsPerMonth": 50, "teamMembers": 1, "storageMb": 100, "aiModel": "openrouter/owl-alpha"}',
  '[{"name":"AI Generation","included":true},{"name":"10 Templates","included":true},{"name":"PPTX Export","included":true},{"name":"Priority Models","included":false},{"name":"Team Collaboration","included":false}]'
),
('pro', 'Pro', 999, 9990,
  '{"presentationsPerMonth": 100, "slidesPerPresentation": 50, "exportsPerMonth": 500, "teamMembers": 1, "storageMb": 1000, "aiModel": "openrouter/owl-alpha"}',
  '[{"name":"AI Generation","included":true},{"name":"10 Templates","included":true},{"name":"PPTX Export","included":true},{"name":"Priority Models","included":true},{"name":"Team Collaboration","included":false}]'
),
('team', 'Team', 2999, 29990,
  '{"presentationsPerMonth": 999, "slidesPerPresentation": 50, "exportsPerMonth": 999, "teamMembers": 10, "storageMb": 10000, "aiModel": "openrouter/owl-alpha"}',
  '[{"name":"AI Generation","included":true},{"name":"10 Templates","included":true},{"name":"PPTX Export","included":true},{"name":"Priority Models","included":true},{"name":"Team Collaboration","included":true}]'
);
```

### presentations
```sql
CREATE TABLE presentations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(500) NOT NULL,
  template_id   VARCHAR(50) DEFAULT 'corporate',
  input_mode    VARCHAR(20) DEFAULT 'topic',
  input_text    TEXT,
  analysis      JSONB,              -- AIAnalysis object
  is_public     BOOLEAN DEFAULT FALSE,
  share_slug    VARCHAR(100) UNIQUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_presentations_user_id ON presentations(user_id);
CREATE INDEX idx_presentations_share_slug ON presentations(share_slug) WHERE share_slug IS NOT NULL;
CREATE INDEX idx_presentations_created_at ON presentations(created_at DESC);
```

### slides
```sql
CREATE TABLE slides (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  type            VARCHAR(30) NOT NULL,
  heading         VARCHAR(500),
  sub             VARCHAR(500),
  content         JSONB NOT NULL,   -- { bullets, leftCol, rightCol, quote, author, stats, timeline, process, chart, chartType, imageUrl, icon, notes }
  position        INTEGER NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_slides_presentation_id ON slides(presentation_id);
```

### subscriptions
```sql
CREATE TABLE subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id             VARCHAR(50) NOT NULL REFERENCES plans(id),
  status              VARCHAR(20) DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end   TIMSTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id     VARCHAR(255),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
```

### usage_logs
```sql
CREATE TABLE usage_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action      VARCHAR(30) NOT NULL,  -- 'generate', 'export', 'regenerate'
  metadata    JSONB,                 -- { slideCount, templateId, ... }
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);
```

### teams
```sql
CREATE TABLE teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### team_members
```sql
CREATE TABLE team_members (
  team_id   UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      VARCHAR(20) DEFAULT 'member',  -- 'owner', 'admin', 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);
```

---

## Migration Path

### Phase 1: Add user accounts
1. Create `users` table
2. Add NextAuth.js or Clerk
3. Update `presentations` table to link to `users`
4. Migrate anonymous sessions to user accounts

### Phase 2: Add saved projects
1. Create `presentations` and `slides` tables
2. Update `StorageAdapter` to use Prisma
3. Add "Save" button to editor UI
4. Add "My Projects" page

### Phase 3: Add subscriptions
1. Create `plans`, `subscriptions` tables
2. Integrate Stripe
3. Update `PaymentAdapter` to use Stripe
4. Add pricing page and checkout flow

### Phase 4: Add teams & collaboration
1. Create `teams`, `team_members` tables
2. Add real-time sync (Yjs or Liveblocks)
3. Add sharing via public slugs
4. Add analytics dashboard
