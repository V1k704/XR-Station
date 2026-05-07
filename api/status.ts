import type { VercelRequest, VercelResponse } from '@vercel/node'

type ServiceStatus = {
  id: string
  label: string
  category: 'ai' | 'database' | 'platform'
  ok: boolean
  latencyMs: number
  detail?: string
}

async function ping(
  fn: () => Promise<string | undefined>,
): Promise<{ ok: boolean; latencyMs: number; detail?: string }> {
  const t0 = Date.now()
  try {
    const detail = await fn()
    return { ok: true, latencyMs: Date.now() - t0, detail }
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - t0, detail: String(e).slice(0, 120) }
  }
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const results: ServiceStatus[] = []

  // ── Supabase ────────────────────────────────────────────────────────────────
  const supaUrl = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '')
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  {
    const r = await ping(async () => {
      if (!supaUrl || !supaKey) throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set')
      const resp = await fetch(`${supaUrl}/rest/v1/user_state?select=username&limit=1`, {
        headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` },
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      return undefined
    })
    results.push({ id: 'supabase', label: 'Supabase DB', category: 'database', ...r })
  }

  // ── OpenRouter keys ─────────────────────────────────────────────────────────
  const openRouterKeys = (process.env.OPENROUTER_API_KEY ?? '')
    .split(',').map((k) => k.trim()).filter(Boolean)
  const models = (process.env.OPENROUTER_MODELS ?? process.env.OPENROUTER_MODEL ?? 'tencent/hy3-preview:free')
    .split(',').map((m) => m.trim()).filter(Boolean)

  if (openRouterKeys.length === 0) {
    results.push({ id: 'or-0', label: 'OpenRouter (no key set)', category: 'ai', ok: false, latencyMs: 0 })
  }

  for (let i = 0; i < openRouterKeys.length; i++) {
    const key = openRouterKeys[i]
    const model = models[i] ?? models[0] ?? 'tencent/hy3-preview:free'
    const shortModel = model.split('/').pop()?.replace(':free', '') ?? model
    const shortKey = `…${key.slice(-6)}`
    const r = await ping(async () => {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] }),
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({})) as Record<string, unknown>
        throw new Error(`HTTP ${resp.status}: ${JSON.stringify(err).slice(0, 60)}`)
      }
      return `key ${shortKey}`
    })
    results.push({ id: `or-${i}`, label: `AI · ${shortModel}`, category: 'ai', ...r })
  }

  // ── GitHub API ───────────────────────────────────────────────────────────────
  {
    const ghToken = process.env.GITHUB_TOKEN ?? ''
    const r = await ping(async () => {
      const headers: Record<string, string> = { Accept: 'application/vnd.github+json' }
      if (ghToken) headers.Authorization = `Bearer ${ghToken}`
      const resp = await fetch('https://api.github.com/rate_limit', { headers })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const data = await resp.json() as { resources?: { core?: { remaining?: number } } }
      const remaining = data?.resources?.core?.remaining ?? '?'
      return `${remaining} requests remaining`
    })
    results.push({ id: 'github', label: 'GitHub API', category: 'platform', ...r })
  }

  // ── HTB API ─────────────────────────────────────────────────────────────────
  {
    const r = await ping(async () => {
      // Use the public search endpoint — returns 200 even unauthenticated
      const resp = await fetch('https://www.hackthebox.com/api/v4/search/fetch?query=test&tags=user', {
        headers: { Accept: 'application/json' },
      })
      // 401/403 = endpoint reachable but auth required — still counts as online
      if (resp.status !== 200 && resp.status !== 401 && resp.status !== 403 && resp.status !== 422) {
        throw new Error(`HTTP ${resp.status}`)
      }
      return undefined
    })
    results.push({ id: 'htb', label: 'Hack The Box API', category: 'platform', ...r })
  }

  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({ checkedAt: new Date().toISOString(), services: results })
}
