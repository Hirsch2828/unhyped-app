// Provider-agnostic JSON generation. Switch provider with the LLM_PROVIDER secret:
//   gemini (default, free tier) | anthropic
// Every call asks for JSON only and parses it; a bad reply throws so the caller can skip that item.

export interface LlmRequest {
  system: string
  prompt: string
  temperature?: number
}

const provider = () => (Deno.env.get('LLM_PROVIDER') ?? 'gemini').toLowerCase()

export async function generateJSON<T>(req: LlmRequest): Promise<T> {
  const text = provider() === 'anthropic' ? await anthropic(req) : await gemini(req)
  return parseJSON<T>(text)
}

export function parseJSON<T>(text: string): T {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  const start = cleaned.search(/[[{]/)
  if (start < 0) throw new Error('LLM reply had no JSON')
  return JSON.parse(cleaned.slice(start)) as T
}

async function gemini({ system, prompt, temperature = 0.2 }: LlmRequest): Promise<string> {
  const key = Deno.env.get('GEMINI_API_KEY')
  if (!key) throw new Error('GEMINI_API_KEY is not set')
  const primary = Deno.env.get('GEMINI_MODEL') ?? (await pickGeminiModel(key))
  let model = primary
  // Low thinking keeps each call fast enough for the edge function time limit.
  const thinking = Deno.env.get('GEMINI_THINKING') ?? 'minimal'
  const call = (withThinking: boolean) =>
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      signal: AbortSignal.timeout(Number(Deno.env.get('LLM_TIMEOUT_MS') ?? 80000)),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          responseMimeType: 'application/json',
          ...(withThinking && thinking !== 'off' ? { thinkingConfig: { thinkingLevel: thinking } } : {}),
        },
      }),
    })
  let res = await call(true)
  // Busy or rate limited: wait a little and try once more, then try the backup model.
  if (res.status === 503 || res.status === 429) {
    await new Promise((r) => setTimeout(r, 4000))
    res = await call(true)
  }
  if ((res.status === 503 || res.status === 429) && fallbackModel && fallbackModel !== primary) {
    model = fallbackModel
    res = await call(true)
  }
  // Older models do not know thinkingLevel: retry once without it.
  if (res.status === 400) {
    const body = await res.text()
    if (!/thinking/i.test(body)) throw new Error(`Gemini 400 (${model}): ${body.slice(0, 300)}`)
    res = await call(false)
  }
  if (!res.ok) throw new Error(`Gemini ${res.status} (${model}): ${(await res.text()).slice(0, 300)}`)
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.filter((p: { thought?: boolean }) => !p.thought)
    .map((p: { text?: string }) => p.text ?? '').join('') ?? ''
  if (!text) throw new Error(`Gemini (${model}) returned an empty reply`)
  return text
}

export const geminiModelInUse = () => cachedModel ?? Deno.env.get('GEMINI_MODEL') ?? null

// Google retires model names over time, so by default we ask the API which models exist
// and take the newest stable "flash" model (fast and on the free tier).
let cachedModel: string | null = null
let fallbackModel: string | null = null
async function pickGeminiModel(key: string): Promise<string> {
  if (cachedModel) return cachedModel
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', {
    headers: { 'x-goog-api-key': key },
  })
  if (!res.ok) throw new Error(`Gemini list models ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  const names: string[] = (data?.models ?? [])
    .filter((m: { supportedGenerationMethods?: string[] }) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m: { name: string }) => m.name.replace(/^models\//, ''))
  cachedModel = chooseModel(names)
  try {
    fallbackModel = chooseModel(names.filter((n) => !n.includes('lite')))
  } catch {
    fallbackModel = null
  }
  return cachedModel
}

// Prefer the newest stable "flash-lite" model (fastest, biggest free quota), then plain flash.
// Skips preview, experimental, media and dated snapshot models.
export function chooseModel(names: string[]): string {
  const version = (n: string) => Number(n.match(/^gemini-(\d+(?:\.\d+)?)/)?.[1] ?? 0)
  const clean = (n: string) => !/(preview|exp|image|tts|audio|live|thinking|-\d{3,})/.test(n)
  const lite = names.filter((n) => /^gemini-[\d.]+-flash-lite$/.test(n))
  const flash = names.filter((n) => /^gemini-[\d.]+-flash/.test(n) && clean(n))
  const pool = lite.length ? lite : flash.length ? flash : names.filter((n) => /^gemini-[\d.]+-flash/.test(n))
  if (!pool.length) throw new Error('No Gemini flash model available for this key')
  return [...pool].sort((a, b) => version(b) - version(a) || a.length - b.length)[0]
}

async function anthropic({ system, prompt, temperature = 0.2 }: LlmRequest): Promise<string> {
  const key = Deno.env.get('ANTHROPIC_API_KEY')
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set')
  const model = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-haiku-5-5'
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      temperature,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const data = await res.json()
  return data?.content?.map((c: { text?: string }) => c.text ?? '').join('') ?? ''
}
