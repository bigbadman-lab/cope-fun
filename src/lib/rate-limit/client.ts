import { RATE_LIMIT_ERROR, RATE_LIMIT_MESSAGE } from "./config";

type RateLimitBody = {
  ok?: boolean;
  error?: string;
  message?: string;
};

export function isRateLimitedStatus(status: number): boolean {
  return status === 429;
}

export function getRateLimitMessage(body?: RateLimitBody | null): string {
  if (body?.error === RATE_LIMIT_ERROR && typeof body.message === "string") {
    return body.message;
  }
  return RATE_LIMIT_MESSAGE;
}

export async function readRateLimitMessage(response: Response): Promise<string> {
  if (!isRateLimitedStatus(response.status)) {
    return RATE_LIMIT_MESSAGE;
  }

  try {
    const body = (await response.json()) as RateLimitBody;
    return getRateLimitMessage(body);
  } catch {
    return RATE_LIMIT_MESSAGE;
  }
}

export async function throwIfRateLimited(response: Response): Promise<void> {
  if (!isRateLimitedStatus(response.status)) return;
  throw new Error(await readRateLimitMessage(response));
}
