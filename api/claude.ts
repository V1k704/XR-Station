import type { VercelRequest, VercelResponse } from '@vercel/node'

type AnthropicMessage = {
  role: 'user' | 'assistant'
  content: string | Array<{ type?: string; text?: string }>
}

type AnthropicRequest = {
  model?: string
  max_tokens?: number
  temperature?: number
  stream?: boolean
  messages?: AnthropicMessage[]
}

function normalizeText(content: AnthropicMessage['content']): string {
  if (typeof content === 'string') return content
  return content
    .filter((part) => (part.type ?? 'text') === 'text')
    .map((part) => part.text ?? '')
    .join('\n')
}

function toOpenRouterMessages(messages: AnthropicMessage[] = []) {
  return messages.map((m) => ({
    role: m.role,
    content: normalizeText(m.content),
  }))
}

function anthropicLikeFromOpenRouter(
  model: string,
  outputText: string,
): Record<string, unknown> {
  return {
    id: `msg_openrouter_${Date.now()}`,
    type: 'message',
    role: 'assistant',
    model,
    stop_reason: 'end_turn',
    content: [{ type: 'text', text: outputText }],
  }
}

function shouldTryNextModel(status: number): boolean {
  return status === 401 || status === 402 || status === 403 || status === 404 || status === 408 || status === 429 || status >= 500
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = (req.body ?? {}) as AnthropicRequest

  // Prefer OpenRouter if configured (cost-friendly multi-provider gateway).
  const openRouterKey = process.env.OPENROUTER_API_KEY
  if (openRouterKey) {
    const requestedModel = typeof body.model === 'string' ? body.model.trim() : ''
    const envModels = (process.env.OPENROUTER_MODELS ?? process.env.OPENROUTER_MODEL ?? '')
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean)
    const models = Array.from(
      new Set([
        ...(requestedModel ? [requestedModel] : []),
        ...envModels,
        'tencent/hy3-preview:free',
      ]),
    )

    let lastStatus = 502
    let lastData: unknown = { error: 'OpenRouter call failed' }
    for (const model of models) {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${openRouterKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: body.max_tokens ?? 400,
          temperature: body.temperature ?? 0.3,
          stream: false,
          messages: toOpenRouterMessages(body.messages),
        }),
      })

      const data = await response.json()
      if (response.ok) {
        const text = data?.choices?.[0]?.message?.content ?? ''
        return res.status(200).json(anthropicLikeFromOpenRouter(model, String(text)))
      }

      lastStatus = response.status
      lastData = data
      if (!shouldTryNextModel(response.status)) {
        return res.status(response.status).json(data)
      }
    }

    return res.status(lastStatus).json(lastData)
  }

  // Anthropic direct fallback (still supported if you use it later).
  const anthropicKeys = process.env.ANTHROPIC_API_KEYS?.split(',')
    .map((k) => k.trim())
    .filter(Boolean)
  const single = process.env.ANTHROPIC_API_KEY?.trim()
  const keys = anthropicKeys?.length ? anthropicKeys : single ? [single] : []
  if (!keys.length) {
    return res.status(500).json({
      error: 'Missing OPENROUTER_API_KEY (or ANTHROPIC_API_KEY / ANTHROPIC_API_KEYS)',
    })
  }

  for (const key of keys) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    })
    const data = await response.json()
    if (response.ok) return res.status(200).json(data)

    const retriable = response.status === 401 || response.status === 429 || response.status >= 500
    if (!retriable) return res.status(response.status).json(data)
  }

  return res.status(502).json({ error: 'All configured Anthropic keys failed' })
}
