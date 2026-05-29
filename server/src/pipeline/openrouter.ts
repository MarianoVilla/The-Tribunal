interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
  model: string
}

export async function callOpenRouter(
  messages: OpenRouterMessage[],
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<{ content: string; model: string; rawBody: string }> {
  const localBase = process.env.LLM_BASE_URL
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!localBase && !apiKey) throw new Error('OPENROUTER_API_KEY is not set')

  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'
  const siteUrl = process.env.OPENROUTER_SITE_URL || process.env.APP_BASE_URL || 'http://localhost:5173'
  const appName = process.env.OPENROUTER_APP_NAME || 'The Tribunal'

  const endpoint = localBase
    ? `${localBase}/v1/chat/completions`
    : 'https://openrouter.ai/api/v1/chat/completions'

  const body = {
    model,
    messages,
    temperature: options.temperature ?? 0.85,
    max_tokens: options.maxTokens ?? 1200,
    response_format: { type: 'json_object' },
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey ?? 'ollama'}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': siteUrl,
      'X-Title': appName,
    },
    body: JSON.stringify(body),
  })

  const rawBody = await res.text()

  if (!res.ok) {
    console.error('[OpenRouter] Error response:', { status: res.status, bodyLength: rawBody.length })
    throw new Error(`OpenRouter API error: ${res.status}`)
  }

  const parsed: OpenRouterResponse = JSON.parse(rawBody)
  const content = parsed.choices?.[0]?.message?.content

  if (!content) {
    console.error('[OpenRouter] No content in response:', { model: parsed.model ?? model, bodyLength: rawBody.length })
    throw new Error('OpenRouter returned no content')
  }

  return { content, model: parsed.model ?? model, rawBody }
}

export async function callOpenRouterWithRetry(
  messages: OpenRouterMessage[],
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<{ content: string; model: string; rawBody: string }> {
  try {
    return await callOpenRouter(messages, options)
  } catch (err) {
    console.warn('[OpenRouter] Retrying after error:', err)
    await new Promise((r) => setTimeout(r, 1500))
    return callOpenRouter(messages, options)
  }
}
