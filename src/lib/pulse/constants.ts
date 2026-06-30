export const PULSE_BELIEF_ROOM_ID = "85bd39d1-0c6c-491b-8485-cded4a742337";

/** Fixed Cope seed added to each Pulse cycle reward pool (not a user stake). */
export const PULSE_CYCLE_SEED_CREDITS = 200;

export const PULSE_CHAT_MIN_BODY_LENGTH = 1;
export const PULSE_CHAT_MAX_BODY_LENGTH = 280;

export function isPulseBeliefRoomId(beliefRoomId: string): boolean {
  return beliefRoomId === PULSE_BELIEF_ROOM_ID;
}
