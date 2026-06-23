import "server-only";
import { createHash } from "node:crypto";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

const MIN_TOKEN_LENGTH = 16;

export type AnonymousSession = {
  id: string;
  session_token_hash: string;
};

function hashAnonymousToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function getOrCreateAnonymousSession(
  token: string,
): Promise<AnonymousSession> {
  const trimmed = token.trim();
  if (trimmed.length < MIN_TOKEN_LENGTH) {
    throw new Error("Anonymous session token is invalid.");
  }

  const sessionTokenHash = hashAnonymousToken(trimmed);
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("anonymous_sessions")
    .upsert(
      {
        session_token_hash: sessionTokenHash,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "session_token_hash" },
    )
    .select("id, session_token_hash")
    .single();

  if (error || !data) {
    throw new Error("Could not create anonymous session.");
  }

  return data;
}
