export type RateLimitAction =
  | "belief_validate"
  | "debate_generate"
  | "debate_follow_up"
  | "room_challenge"
  | "room_create"
  | "vote"
  | "reaction";

export type RateLimitWindow = {
  maxRequests: number;
  windowSeconds: number;
};

export const RATE_LIMIT_MESSAGE =
  "You've reached the limit for now. Try again later.";

export const RATE_LIMIT_ERROR = "rate_limited";

const HOUR = 60 * 60;
const DAY = 24 * HOUR;

export const RATE_LIMITS: Record<RateLimitAction, RateLimitWindow> = {
  belief_validate: { maxRequests: 10, windowSeconds: HOUR },
  debate_generate: { maxRequests: 10, windowSeconds: HOUR },
  debate_follow_up: { maxRequests: 100, windowSeconds: DAY },
  room_challenge: { maxRequests: 100, windowSeconds: DAY },
  room_create: { maxRequests: 25, windowSeconds: DAY },
  vote: { maxRequests: 200, windowSeconds: HOUR },
  reaction: { maxRequests: 300, windowSeconds: HOUR },
};

export const RATE_LIMIT_IP_MULTIPLIER = 2;
