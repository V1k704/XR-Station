import type { VercelRequest, VercelResponse } from '@vercel/node'

const URL = 'https://api.github.com/graphql'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const token = process.env.GITHUB_TOKEN
  if (!token) return res.status(500).json({ error: 'Missing GITHUB_TOKEN' })
  const response = await fetch(URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(req.body),
  })
  const data = await response.json()
  return res.status(response.status).json(data)
}
