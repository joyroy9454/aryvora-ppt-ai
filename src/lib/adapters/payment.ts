// ============================================================
// Payment Adapter — Abstraction layer for subscriptions & credits.
//
// Today: everything is free, no payments.
// Future: swap in Stripe/LemonSqueezy by implementing
//   this interface — zero changes to business logic.
// ============================================================

// ---------- Types ----------

export interface Plan {
  id: string;
  name: string;
  priceMonthly: number; // 0 = free
  priceYearly: number;
  features: PlanFeature[];
  limits: PlanLimits;
}

export interface PlanFeature {
  name: string;
  included: boolean;
  value?: string;
}

export interface PlanLimits {
  presentationsPerMonth: number;
  slidesPerPresentation: number;
  exportsPerMonth: number;
  teamMembers: number;
  storageMb: number;
  aiModel: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: "active" | "canceled" | "past_due" | "trialing" | "paused";
  currentPeriodStart: string; // ISO
  currentPeriodEnd: string; // ISO
  cancelAtPeriodEnd: boolean;
}

export interface CheckoutSession {
  id: string;
  url: string;
  planId: string;
  userId: string;
}

// ---------- Payment adapter interface ----------

export interface PaymentAdapter {
  getPlans(): Promise<Plan[]>;
  getSubscription(userId: string): Promise<Subscription | null>;
  createCheckoutSession(userId: string, planId: string, billing: "monthly" | "yearly"): Promise<CheckoutSession>;
  cancelSubscription(userId: string): Promise<Subscription | null>;
  getCustomerPortalUrl(userId: string): Promise<string | null>;
}

// ---------- Current implementation: free (no payments) ----------

const FREE_PLAN: Plan = {
  id: "free",
  name: "Free",
  priceMonthly: 0,
  priceYearly: 0,
  features: [
    { name: "AI Presentation Generation", included: true },
    { name: "10 Design Templates", included: true },
    { name: "PPTX & PDF Export", included: true },
    { name: "Unlimited Slides", included: true },
    { name: "Priority AI Models", included: false },
    { name: "Team Collaboration", included: false },
    { name: "Analytics Dashboard", included: false },
    { name: "White-label Export", included: false },
  ],
  limits: {
    presentationsPerMonth: 999,
    slidesPerPresentation: 25,
    exportsPerMonth: 999,
    teamMembers: 1,
    storageMb: 100,
    aiModel: "openrouter/owl-alpha",
  },
};

/**
 * FreePaymentAdapter — the default implementation.
 *
 * Everything is free. No Stripe keys needed.
 * When you add payments:
 *  1. Create StripePaymentAdapter implementing PaymentAdapter
 *  2. Add plan config in database or config file
 *  3. Swap in the factory
 */
export class FreePaymentAdapter implements PaymentAdapter {
  async getPlans(): Promise<Plan[]> {
    return [FREE_PLAN];
  }

  async getSubscription(_userId: string): Promise<Subscription | null> {
    return {
      id: "sub_free_default",
      userId: "anon",
      planId: "free",
      status: "active",
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
    };
  }

  async createCheckoutSession(_userId: string, _planId: string, _billing: "monthly" | "yearly"): Promise<CheckoutSession> {
    throw new Error("Payments not configured. This is a free deployment.");
  }

  async cancelSubscription(userId: string): Promise<Subscription | null> {
    return this.getSubscription(userId);
  }

  async getCustomerPortalUrl(_userId: string): Promise<string | null> {
    return null;
  }
}

// Singleton — swap this out when you add payments
export const payments = new FreePaymentAdapter();
