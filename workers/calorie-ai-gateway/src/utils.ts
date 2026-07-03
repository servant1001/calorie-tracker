export function parseJsonStringArray(input: string | undefined): string[] {
  if (!input) {
    return []
  }

  try {
    const parsed = JSON.parse(input) as unknown

    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => String(item).trim())
        .filter(Boolean)
    }
  } catch {
    return input
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

export function parseProviderOrder(input: string | undefined) {
  return (input ?? 'openai')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function parseAllowedOrigins(input: string | undefined) {
  return (input ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(init.headers ?? {}),
    },
  })
}

export function buildCorsHeaders(origin: string | null, allowedOrigin?: string) {
  const allowedOrigins = parseAllowedOrigins(allowedOrigin)
  const resolvedOrigin = origin && allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0] || origin || '*'

  return {
    'Access-Control-Allow-Origin': resolvedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export async function parseJsonBody<TBody>(request: Request): Promise<TBody> {
  return request.json() as Promise<TBody>
}

export function normalizeJsonText(input: string) {
  return input
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

export function safeJsonParse<TData>(input: string): TData {
  return JSON.parse(normalizeJsonText(input)) as TData
}
