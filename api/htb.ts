import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = String(req.query.userId || '').trim()
  if (!userId) return res.status(400).json({ error: 'Provide userId query param' })
  const url = `https://www.hackthebox.com/api/v4/user/profile/basic/${encodeURIComponent(userId)}`
  const response = await fetch(url)
  const data = await response.json()
  return res.status(response.status).json(data)
}
