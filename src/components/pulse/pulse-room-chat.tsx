"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppAuth } from "@/hooks/use-app-auth";
import { BeliefInput } from "@/components/belief-input";
import { RoomComposerShell } from "@/components/room-composer-shell";
import { UserAccountAvatar } from "@/components/user-account-avatar";
import { AVATAR_PRESET_COLOR_IDS } from "@/lib/profile/avatar-colors";
import { PULSE_CHAT_MAX_BODY_LENGTH } from "@/lib/pulse/constants";

const POLL_INTERVAL_MS = 4000;

type PulseRoomMessageAvatar = {
  type: "uploaded" | "preset" | "fallback";
  color: string | null;
  imageUrl: string | null;
  updatedAt: string | null;
};

type PulseRoomMessage = {
  id: string;
  beliefRoomId: string;
  userId: string | null;
  displayLabel: string | null;
  walletAddress: string | null;
  body: string;
  createdAt: string;
  avatar?: PulseRoomMessageAvatar;
};

type PulseChatListResponse =
  | { ok: true; messages: PulseRoomMessage[] }
  | { ok: false; error: string };

type PulseChatPostResponse =
  | { ok: true; message: PulseRoomMessage }
  | { ok: false; error: string };

type PulseRoomChatProps = {
  beliefRoomId: string;
};

function formatMessageTime(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRelativeAge(createdAt: string): string {
  const then = new Date(createdAt).getTime();
  if (Number.isNaN(then)) return "";

  const diffSeconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSeconds < 45) return "now";

  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  return new Date(then).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function messageAuthorLabel(message: PulseRoomMessage): string {
  if (message.displayLabel?.trim()) return message.displayLabel.trim();
  if (message.walletAddress) return message.walletAddress;
  if (message.userId) return `User ${message.userId.slice(0, 8)}`;
  return "Anonymous";
}

function fallbackAvatarColorForMessage(message: PulseRoomMessage): string {
  const seed =
    message.userId ??
    message.walletAddress ??
    message.displayLabel ??
    message.id;

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return AVATAR_PRESET_COLOR_IDS[hash % AVATAR_PRESET_COLOR_IDS.length];
}

// Render with the author's real avatar config when available, otherwise a
// deterministic fallback color so older/profile-less rows still look distinct.
function avatarPropsForMessage(message: PulseRoomMessage): {
  avatarColor: string;
  avatarPublicUrl: string | null;
  avatarUpdatedAt: string | null;
} {
  const avatar = message.avatar;

  if (avatar?.type === "uploaded" && avatar.imageUrl) {
    return {
      avatarColor: avatar.color ?? fallbackAvatarColorForMessage(message),
      avatarPublicUrl: avatar.imageUrl,
      avatarUpdatedAt: avatar.updatedAt,
    };
  }

  if (avatar?.type === "preset" && avatar.color) {
    return {
      avatarColor: avatar.color,
      avatarPublicUrl: null,
      avatarUpdatedAt: null,
    };
  }

  return {
    avatarColor: fallbackAvatarColorForMessage(message),
    avatarPublicUrl: null,
    avatarUpdatedAt: null,
  };
}

export function PulseRoomChat({ beliefRoomId }: PulseRoomChatProps) {
  const { ready, authenticated, login, authFetch } = useAppAuth();
  const [messages, setMessages] = useState<PulseRoomMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldStickToBottomRef = useRef(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/pulse/chat?beliefRoomId=${encodeURIComponent(beliefRoomId)}`,
        { cache: "no-store" },
      );

      const payload = (await response.json()) as PulseChatListResponse;
      if (!response.ok || !payload.ok) {
        setLoadError(
          payload.ok ? "Could not load Pulse chat." : payload.error,
        );
        return;
      }

      setLoadError(null);
      setMessages(payload.messages);
      if (shouldStickToBottomRef.current) {
        requestAnimationFrame(() => scrollToBottom("auto"));
      }
    } catch {
      setLoadError("Could not load Pulse chat.");
    } finally {
      setIsLoading(false);
    }
  }, [beliefRoomId, scrollToBottom]);

  useEffect(() => {
    void loadMessages();

    const intervalId = window.setInterval(() => {
      void loadMessages();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [loadMessages]);

  useEffect(() => {
    if (messages.length > 0 && shouldStickToBottomRef.current) {
      scrollToBottom("auto");
    }
  }, [messages.length, scrollToBottom]);

  async function handleSubmit() {
    const body = draft.trim();
    if (!body || isSending) return;

    if (body.length > PULSE_CHAT_MAX_BODY_LENGTH) {
      setPostError(
        `Message must be ${PULSE_CHAT_MAX_BODY_LENGTH} characters or fewer.`,
      );
      return;
    }

    setIsSending(true);
    setPostError(null);
    shouldStickToBottomRef.current = true;

    try {
      const response = await authFetch("/api/pulse/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beliefRoomId, body }),
      });

      const payload = (await response.json()) as PulseChatPostResponse;
      if (!response.ok || !payload.ok) {
        setPostError(
          payload.ok ? "Could not send message." : payload.error,
        );
        return;
      }

      setDraft("");
      setMessages((current) => [...current, payload.message]);
      requestAnimationFrame(() => {
        scrollToBottom();
        textareaRef.current?.focus({ preventScroll: true });
      });
    } catch {
      setPostError("Could not send message.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-md min-h-0 flex-1 flex-col px-4 pt-3">
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Live Pulse chat
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Share your thoughts with the room
          </p>
        </div>

        <div
          className="-mx-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-[calc(6.5rem+var(--scroll-bottom-inset))]"
          onScroll={(event) => {
            const element = event.currentTarget;
            const distanceFromBottom =
              element.scrollHeight - element.scrollTop - element.clientHeight;
            shouldStickToBottomRef.current = distanceFromBottom < 48;
          }}
        >
          {isLoading ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              Loading chat…
            </p>
          ) : loadError ? (
            <p className="py-8 text-center text-sm text-orange-700 dark:text-orange-300">
              {loadError}
            </p>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Pulse chat will appear here.
            </p>
          ) : (
            <ul className="space-y-0.5 pb-3">
              {messages.map((message) => {
                const label = messageAuthorLabel(message);

                return (
                  <li
                    key={message.id}
                    className="group flex gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-zinc-100/70 dark:hover:bg-white/[0.04]"
                  >
                    <UserAccountAvatar
                      label={label}
                      size="sm"
                      className="mt-0.5"
                      {...avatarPropsForMessage(message)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                          {label}
                        </span>
                        <time
                          dateTime={message.createdAt}
                          title={formatMessageTime(message.createdAt)}
                          className="ml-auto shrink-0 text-[10px] tabular-nums text-zinc-400 dark:text-zinc-500"
                        >
                          {formatRelativeAge(message.createdAt)}
                        </time>
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
                        {message.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div ref={messagesEndRef} aria-hidden className="h-1" />
        </div>
      </div>

      <RoomComposerShell>
        {!ready ? (
          <p className="text-center text-xs text-zinc-500">Loading…</p>
        ) : !authenticated ? (
          <div className="space-y-3">
            <BeliefInput
              value=""
              onChange={() => {}}
              onSubmit={() => login()}
              disabled
              compact
              placeholder="Sign in to join the live Pulse chat"
              submitAriaLabel="Sign in to chat"
            />
            <button
              type="button"
              onClick={() => login()}
              className="inline-flex min-h-9 w-full items-center justify-center rounded-lg bg-cope-orange text-sm font-medium text-white"
            >
              Sign in
            </button>
          </div>
        ) : (
          <BeliefInput
            ref={textareaRef}
            value={draft}
            onChange={(value) => {
              setDraft(value);
              if (postError) setPostError(null);
            }}
            onSubmit={() => void handleSubmit()}
            disabled={isSending}
            isProcessing={isSending}
            compact
            placeholder="Share your thoughts with the room..."
            submitAriaLabel="Send message"
            processingAriaLabel="Sending message"
            helperText={postError ?? undefined}
          />
        )}
      </RoomComposerShell>
    </>
  );
}
