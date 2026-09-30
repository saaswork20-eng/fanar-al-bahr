/**
 * FANAR AL BHAR — PRODUCTION RATE LIMITING SERVICE
 *
 * Implements a memory-efficient sliding-window rate limiter for sensitive endpoints.
 * Easily swappable for Redis in multi-instance production environments.
 *
 * Targets:
 * - /api/v1/auth/login (5 attempts per 15 min per IP/Email)
 * - /api/v1/auth/register (3 attempts per hour per IP)
 * - /api/v1/auth/forgot-password (3 attempts per hour per IP)
 * - /api/v1/checkout/order (10 orders per 10 min per buyer)
 * - /api/v1/coupons/validate (20 attempts per 5 min per buyer)
 * - /api/v1/reviews (5 reviews per 10 min per buyer)
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired entries every 10 minutes to prevent memory leaks
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  const maxWindow = 3600 * 1000; // 1 hour max window
  rateLimitStore.forEach((record, key) => {
    record.timestamps = record.timestamps.filter((ts) => now - ts < maxWindow);
    if (record.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  });
}, 10 * 60 * 1000);
if (typeof cleanupTimer.unref === 'function') {
  cleanupTimer.unref();
}

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

/**
 * Checks and records an attempt against the rate limit window.
 */
export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const { key, limit, windowMs } = options;
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter timestamps within the current sliding window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= limit) {
    const oldestTimestamp = record.timestamps[0];
    const resetTime = oldestTimestamp + windowMs;
    return {
      success: false,
      limit,
      remaining: 0,
      resetTime,
    };
  }

  record.timestamps.push(now);
  return {
    success: true,
    limit,
    remaining: limit - record.timestamps.length,
    resetTime: now + windowMs,
  };
}

/**
 * Helper to extract client IP address from standard request headers.
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
