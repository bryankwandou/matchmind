/**
 * In-memory rate limiter — suitable for single-instance serverless (Vercel Edge).
 * For multi-region production, replace the store with an Upstash Redis client.
 */

type Entry = { count: number; reset: number };

const store = new Map<string, Entry>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 20;  // per IP per minute on commentary endpoint

export function rateLimitCheck(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.reset) {
    store.set(ip, { count: 1, reset: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt: now + WINDOW_MS };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.reset };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_REQUESTS - entry.count, resetAt: entry.reset };
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
