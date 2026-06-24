import "server-only";
import { getOrCreateAnonymousSession } from "@/lib/db/anonymous-session";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  RATE_LIMIT_ERROR,
  RATE_LIMIT_IP_MULTIPLIER,
  RATE_LIMIT_MESSAGE,
  RATE_LIMITS,
  type RateLimitAction,
  type RateLimitWindow,
} from "./config";
import { getClientIp, hashClientIp } from "./request";

const MIN_TOKEN_LENGTH = 16;

type RateLimitRpcRow = {
  allowed: boolean;
  current_count: number;
};

export function rateLimitedResponse(): Response {
  return Response.json(
    {
      ok: false,
      error: RATE_LIMIT_ERROR,
      message: RATE_LIMIT_MESSAGE,
    },
    { status: 429 },
  );
}

async function incrementRateLimitBucket(
  bucketKey: string,
  config: RateLimitWindow,
): Promise<boolean> {
  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase.rpc("increment_rate_limit_counter", {
      p_bucket_key: bucketKey,
      p_window_seconds: config.windowSeconds,
      p_max_requests: config.maxRequests,
    });

    if (error) {
      console.error("Rate limit check failed:", error.message);
      return true;
    }

    const row = (Array.isArray(data) ? data[0] : data) as
      | RateLimitRpcRow
      | undefined;
    return row?.allowed ?? true;
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return true;
  }
}

function getIpLimitConfig(config: RateLimitWindow): RateLimitWindow {
  return {
    windowSeconds: config.windowSeconds,
    maxRequests: config.maxRequests * RATE_LIMIT_IP_MULTIPLIER,
  };
}

async function checkSessionBucket(
  action: RateLimitAction,
  anonymousToken: string,
): Promise<boolean> {
  if (anonymousToken.length < MIN_TOKEN_LENGTH) return true;

  try {
    const session = await getOrCreateAnonymousSession(anonymousToken);
    const bucketKey = `${action}:session:${session.id}`;
    return incrementRateLimitBucket(bucketKey, RATE_LIMITS[action]);
  } catch {
    return true;
  }
}

async function checkIpBucket(
  action: RateLimitAction,
  request: Request,
): Promise<boolean> {
  const ip = getClientIp(request);
  const bucketKey = `${action}:ip:${hashClientIp(ip)}`;
  return incrementRateLimitBucket(bucketKey, getIpLimitConfig(RATE_LIMITS[action]));
}

export async function enforceRateLimit(input: {
  request: Request;
  action: RateLimitAction;
  anonymousToken?: string;
}): Promise<Response | null> {
  const [sessionAllowed, ipAllowed] = await Promise.all([
    checkSessionBucket(input.action, input.anonymousToken ?? ""),
    checkIpBucket(input.action, input.request),
  ]);

  if (!sessionAllowed || !ipAllowed) {
    return rateLimitedResponse();
  }

  return null;
}
