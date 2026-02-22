// Plan limits and voice access config

export const PLAN_CALL_LIMITS: Record<string, number> = {
  trial:      15,
  starter:    300,
  business:   700,
  pro:        1500,
  enterprise: Infinity,
};

// Curated voice IDs per plan (ElevenLabs premade voices)
export const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel

export const PLAN_VOICE_ACCESS: Record<string, "default" | "curated" | "all"> = {
  trial:      "default",
  starter:    "default",
  business:   "curated",
  pro:        "all",
  enterprise: "all",
};

// 5 curated voices for Business plan
export const CURATED_VOICE_IDS = [
  "21m00Tcm4TlvDq8ikWAM", // Rachel — warm, professional female
  "AZnzlk1XvdvUeBnXmlld", // Domi — strong female
  "EXAVITQu4vr4xnSDxMaL", // Bella — soft female
  "ErXwobaYiN019PkySvjV", // Antoni — well-rounded male
  "VR6AewLTigWG4xSOukaG", // Arnold — confident male
];

export interface PlanStatus {
  allowed: boolean;
  reason?: string;
  callsUsed: number;
  callsLimit: number;
  isTrialExpired: boolean;
  daysLeftInTrial: number;
  plan: string;
}

export function getPlanStatus(business: {
  plan: string;
  trialEndsAt: Date;
  monthlyCallCount: number;
  callCountResetAt: Date;
}): PlanStatus {
  const now = new Date();
  const plan = business.plan;
  const limit = PLAN_CALL_LIMITS[plan] ?? 50;

  // Check trial expiry
  const isTrialExpired = plan === "trial" && business.trialEndsAt < now;
  const daysLeftInTrial = plan === "trial"
    ? Math.max(0, Math.ceil((business.trialEndsAt.getTime() - now.getTime()) / 86400000))
    : 0;

  if (isTrialExpired) {
    return {
      allowed: false,
      reason: "Your 14-day free trial has ended. Please upgrade to continue.",
      callsUsed: business.monthlyCallCount,
      callsLimit: limit,
      isTrialExpired: true,
      daysLeftInTrial: 0,
      plan,
    };
  }

  // Check monthly call limit
  const callsUsed = business.monthlyCallCount;
  if (callsUsed >= limit) {
    return {
      allowed: false,
      reason: `You've reached your ${limit} call limit for this month. Please upgrade your plan.`,
      callsUsed,
      callsLimit: limit,
      isTrialExpired: false,
      daysLeftInTrial,
      plan,
    };
  }

  return {
    allowed: true,
    callsUsed,
    callsLimit: limit,
    isTrialExpired: false,
    daysLeftInTrial,
    plan,
  };
}
