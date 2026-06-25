import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getOrCreateAnonymousSession } from "@/lib/db/anonymous-session";
import {
  extractPrivyProfile,
  fetchPrivyUser,
  verifyPrivyRequest,
  type VerifiedPrivyAuth,
} from "./privy";

export type AppUser = {
  id: string;
  privyUserId: string;
  walletAddress: string | null;
  email: string | null;
  displayName: string | null;
  linkedAnonymousSessionId: string | null;
  avatarColor: string | null;
  avatarUrl: string | null;
  avatarUpdatedAt: string | null;
};

type AppUserRow = {
  id: string;
  privy_user_id: string;
  wallet_address: string | null;
  email: string | null;
  display_name: string | null;
  linked_anonymous_session_id: string | null;
  avatar_color: string | null;
  avatar_url: string | null;
  avatar_updated_at: string | null;
};

function toAppUser(row: AppUserRow): AppUser {
  return {
    id: row.id,
    privyUserId: row.privy_user_id,
    walletAddress: row.wallet_address,
    email: row.email,
    displayName: row.display_name,
    linkedAnonymousSessionId: row.linked_anonymous_session_id,
    avatarColor: row.avatar_color,
    avatarUrl: row.avatar_url,
    avatarUpdatedAt: row.avatar_updated_at,
  };
}

export async function getOrCreateAppUser(
  auth: VerifiedPrivyAuth,
): Promise<AppUser> {
  const privyUser = await fetchPrivyUser(auth.privyUserId);
  const profile = extractPrivyProfile(privyUser);
  const supabase = createSupabaseServiceClient();
  const now = new Date().toISOString();

  const { data: existing, error: existingError } = await supabase
    .from("app_users")
    .select("*")
    .eq("privy_user_id", auth.privyUserId)
    .maybeSingle();

  if (existingError) {
    throw new Error("Could not load app user.");
  }

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from("app_users")
      .update({
        wallet_address: profile.walletAddress ?? existing.wallet_address,
        email: profile.email ?? existing.email,
        last_seen_at: now,
        updated_at: now,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (updateError || !updated) {
      throw new Error("Could not update app user.");
    }

    return toAppUser(updated as AppUserRow);
  }

  const { data: created, error: createError } = await supabase
    .from("app_users")
    .insert({
      privy_user_id: auth.privyUserId,
      wallet_address: profile.walletAddress,
      email: profile.email,
      display_name: profile.displayName,
      last_seen_at: now,
    })
    .select("*")
    .single();

  if (createError) {
    if (createError.code === "23505") {
      const { data: raced, error: racedError } = await supabase
        .from("app_users")
        .select("*")
        .eq("privy_user_id", auth.privyUserId)
        .single();

      if (racedError || !raced) {
        throw new Error("Could not create app user.");
      }

      return toAppUser(raced as AppUserRow);
    }

    throw new Error("Could not create app user.");
  }

  if (!created) {
    throw new Error("Could not create app user.");
  }

  return toAppUser(created as AppUserRow);
}

export async function linkAnonymousSessionToAppUser(
  appUserId: string,
  anonymousToken: string,
): Promise<void> {
  const session = await getOrCreateAnonymousSession(anonymousToken);
  const supabase = createSupabaseServiceClient();

  const { error } = await supabase
    .from("app_users")
    .update({
      linked_anonymous_session_id: session.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", appUserId);

  if (error) {
    throw new Error("Could not link anonymous session.");
  }
}

export async function tryGetAppUserFromRequest(
  request: Request,
): Promise<AppUser | null> {
  const auth = await verifyPrivyRequest(request);
  if (!auth) return null;

  return getOrCreateAppUser(auth);
}
