// api/anthropic.js — Vercel serverless function
// Proxies requests to Anthropic, keeping the API key server-side only.
//
// Only signed-in NoShow users get through: the browser sends its Supabase
// access token, and Supabase confirms it belongs to a real session before
// anything reaches Anthropic. Model and length are limited to what the app
// itself asks for, so a signed-in session can't be used as an open Claude proxy.

const ALLOWED_MODELS = new Set(['claude-sonnet-4-6', 'claude-sonnet-4-20250514'])
const MAX_TOKENS = 4096 // the app's largest request is 2048 (Notion import)

// Asks Supabase whether the bearer token is a live session. Fails closed.
async function isSignedIn(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return false
  const url = process.env.VITE_SUPABASE_URL
  if (!url || !process.env.VITE_SUPABASE_ANON_KEY) return false
  try {
    const r = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: process.env.VITE_SUPABASE_ANON_KEY, Authorization: authHeader },
    })
    return r.ok
  } catch {
    return false
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  if (!(await isSignedIn(req.headers.authorization))) {
    return res.status(401).json({ error: 'Sign in to use AI features' })
  }

  const { model, max_tokens, system, messages } = req.body || {}
  if (!ALLOWED_MODELS.has(model)) {
    return res.status(400).json({ error: 'Model not allowed' })
  }
  if (!Number.isInteger(max_tokens) || max_tokens < 1 || max_tokens > MAX_TOKENS) {
    return res.status(400).json({ error: `max_tokens must be 1-${MAX_TOKENS}` })
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages required' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      // Forward only the fields the app uses, never the raw body.
      body: JSON.stringify({ model, max_tokens, ...(system ? { system } : {}), messages }),
    })

    const data = await response.json()
    res.status(response.status).json(data)
  } catch (err) {
    res.status(500).json({ error: 'Proxy error', detail: err.message })
  }
}
