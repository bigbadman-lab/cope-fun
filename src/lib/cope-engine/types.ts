import type { ChatMessage } from "@/components/debate-chat";
import type { AgentSlug } from "@/lib/agent-profiles";

export type BeliefValidationReason =
  | "ok"
  | "empty"
  | "too_short"
  | "too_long"
  | "not_belief"
  | "too_vague"
  | "unsafe"
  | "spam"
  | "error";

export type BeliefValidationResult = {
  ok: boolean;
  originalBelief: string;
  normalizedBelief: string;
  reason: BeliefValidationReason;
  issues: string[];
  message: string;
  suggestedRewrite?: string;
  isDebatable: boolean;
  isMarketReadyCandidate: boolean;
  marketReadinessReason?: string;
};

export type DebateGenerationResult = {
  ok: boolean;
  belief: string;
  messages: ChatMessage[];
  agents: AgentSlug[];
  summary?: string;
  roomTitle?: string;
  searchSummary?: string;
  topics?: string[];
  error?: string;
};

export type FollowUpGenerationResult = {
  ok: boolean;
  belief: string;
  followUp: string;
  messages: ChatMessage[];
  agents: AgentSlug[];
  error?: string;
};
