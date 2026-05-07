import type { VercelRequest, VercelResponse } from '@vercel/node'

const SUPABASE_URL = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '')
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

const sbHeaders = () => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase not configured' })
  }

  // ── GET /api/state?username=V1k704 ─────────────────────────────────────────
  if (req.method === 'GET') {
    const username = String(req.query.username ?? '').trim()
    if (!username) return res.status(400).json({ error: 'username required' })

    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/user_state?username=eq.${encodeURIComponent(username)}&select=state,updated_at`,
      { headers: sbHeaders() },
    )
    const data = await r.json()
    if (!r.ok) return res.status(500).json({ error: 'Failed to load state' })
    const row = Array.isArray(data) && data.length > 0 ? data[0] : null
    return res.status(200).json(row ?? { state: null })
  }

  // ── POST /api/state  { username, state } ──────────────────────────────────
  if (req.method === 'POST') {
    const body = req.body ?? {}
    const { username, state } = body as { username?: string; state?: unknown }
    if (!username || !state) {
      return res.status(400).json({ error: 'username and state required' })
    }

    const r = await fetch(`${SUPABASE_URL}/rest/v1/user_state`, {
      method: 'POST',
      headers: {
        ...sbHeaders(),
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        username,
        state,
        updated_at: new Date().toISOString(),
      }),
    })

    if (!r.ok) {
      const err = await r.text()
      return res.status(500).json({ error: err })
    }
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
