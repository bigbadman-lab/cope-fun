const CREATOR_SESSION_KEY = "cope-fun:room-creator-session";

export function getRoomCreatorSessionId(): string {
  if (typeof window === "undefined") return "";

  let id = localStorage.getItem(CREATOR_SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CREATOR_SESSION_KEY, id);
  }

  return id;
}

export function isRoomCreator(creatorId: string | undefined): boolean {
  if (!creatorId) return false;
  return creatorId === getRoomCreatorSessionId();
}
