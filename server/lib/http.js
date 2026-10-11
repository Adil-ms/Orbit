import crypto from 'node:crypto'

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

export const newId = (prefix) => `${prefix}_${crypto.randomBytes(9).toString('base64url')}`

/** Validates `data` with a zod schema; throws a 400 with field messages on failure. */
export function validate(schema, data) {
  const result = schema.safeParse(data)
  if (!result.success) {
    const fields = {}
    for (const issue of result.error.issues) fields[issue.path.join('.') || '_'] = issue.message
    throw new HttpError(400, 'Please check the highlighted fields.', { fields })
  }
  return result.data
}

/** Wraps an async route handler so thrown errors reach the error middleware. */
export const handler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// Express identifies error middleware by its 4-parameter signature, so `_next` must stay
// eslint-disable-next-line no-unused-vars
export function errorMiddleware(err, req, res, _next) {
  const status = err.status || (err.type === 'entity.parse.failed' ? 400 : 500)
  if (status >= 500) console.error('[api]', err)
  res.status(status).json({
    error: status >= 500 ? 'Something went wrong on our side. Please try again.' : err.message,
    ...(err.details ? { details: err.details } : {}),
  })
}

/** Masks a phone number for logs and UI: +91•••••1234 */
export function maskPhone(e164) {
  if (!e164) return ''
  return `${e164.slice(0, 3)}${'•'.repeat(Math.max(0, e164.length - 7))}${e164.slice(-4)}`
}

export function normalizeE164(input) {
  const digits = String(input || '').replace(/[^\d+]/g, '')
  const cleaned = digits.startsWith('+') ? `+${digits.slice(1).replace(/\+/g, '')}` : `+${digits}`
  return /^\+[1-9]\d{7,14}$/.test(cleaned) ? cleaned : null
}
