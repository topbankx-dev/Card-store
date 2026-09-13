import { NextRequest, NextResponse } from 'next/server'

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory store for rate limiting tokens
const rateLimitMap = new Map<string, RateLimitRecord>()

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitOptions {
  limit: number      // Maximum number of allowed requests
  windowMs: number   // Window size in milliseconds
  prefix?: string    // Prefix to namespace different endpoints
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Extract client IP from NextRequest headers
 */
export function getClientIp(request: NextRequest | Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) {
    return cfIp.trim()
  }
  return '127.0.0.1'
}

/**
 * Check rate limit for a request
 */
export function checkRateLimit(
  request: NextRequest | Request,
  options: RateLimitOptions
): RateLimitResult {
  const ip = getClientIp(request)
  const key = `${options.prefix || 'rl'}:${ip}`
  const now = Date.now()

  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + options.windowMs,
    })
    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - 1,
      reset: Math.ceil((now + options.windowMs) / 1000),
    }
  }

  if (record.count >= options.limit) {
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      reset: Math.ceil(record.resetTime / 1000),
    }
  }

  record.count += 1
  return {
    success: true,
    limit: options.limit,
    remaining: options.limit - record.count,
    reset: Math.ceil(record.resetTime / 1000),
  }
}

/**
 * Helper to generate 429 response with rate limit headers
 */
export function rateLimitResponse(result: RateLimitResult, customMessage?: string) {
  return NextResponse.json(
    {
      error: 'Too Many Requests',
      message: customMessage || 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.max(0, result.reset - Math.ceil(Date.now() / 1000)),
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': Math.max(0, result.reset - Math.ceil(Date.now() / 1000)).toString(),
      },
    }
  )
}

// Preset configurations
export const RATE_LIMIT_PRESETS = {
  // 5 attempts per 15 minutes (Auth, Login, Register, Password Reset)
  AUTH: { limit: 5, windowMs: 15 * 60 * 1000, prefix: 'auth' },
  // 10 attempts per minute (Checkout, Public Registration, Order submission)
  ACTION: { limit: 10, windowMs: 60 * 1000, prefix: 'action' },
  // 60 requests per minute (General public API routes)
  GENERAL: { limit: 60, windowMs: 60 * 1000, prefix: 'gen' },
  // 100 requests per minute (Admin routes)
  ADMIN: { limit: 120, windowMs: 60 * 1000, prefix: 'admin' },
}
