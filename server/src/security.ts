import type { Express, NextFunction, Request, Response } from 'express'
import rateLimit from 'express-rate-limit'

const DEFAULT_APP_BASE_URL = 'http://localhost:5173'

function envFlag(name: string): boolean {
  return process.env[name]?.toLowerCase() === 'true'
}

function appOrigin(): string {
  return new URL(process.env.APP_BASE_URL || DEFAULT_APP_BASE_URL).origin
}

function requestOrigin(req: Request): string | null {
  const origin = req.get('origin')
  if (origin) return origin

  const referer = req.get('referer')
  if (!referer) return null

  try {
    return new URL(referer).origin
  } catch {
    return null
  }
}

export function storeRawLlmResponses(): boolean {
  return envFlag('STORE_RAW_LLM_RESPONSES')
}

export function configureTrustProxy(app: Express): void {
  if (envFlag('TRUST_PROXY')) {
    app.set('trust proxy', 1)
  }
}

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  next()
}

export function requireValidOrigin(req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV !== 'production') {
    next()
    return
  }

  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    next()
    return
  }

  if (requestOrigin(req) !== appOrigin()) {
    res.status(403).json({ error: 'Invalid request origin' })
    return
  }

  next()
}

export const authRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many auth requests. Please try again later.' },
})

export const trialRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many trial requests. Please try again later.' },
})
