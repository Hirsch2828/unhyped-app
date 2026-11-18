// Draws an illustration for each new story with Cloudflare Workers AI (FLUX.1 schnell, free daily quota),
// stores it in the public "images" bucket and links it to the story.
// Rules: illustrations only, no real faces, no logos, no text. Every generated image is tagged "ai"
// so the site can show an "Illustration" badge.
//
// Body (optional):
//   {}                                         -> stories mode: up to PER_RUN stories without their own image
//   { "mode": "library", "topic": "ai", "area": "agents", "count": 3 } -> backup library images for one area
import { authorized, db, json } from '../_shared/db.ts'
import { generateJSON } from '../_shared/llm.ts'
import jpeg from 'npm:jpeg-js@0.4.4'

const PER_RUN = 4 // each image costs ~0.2s CPU to shrink; stay well under the edge CPU limit
const DAILY_CAP = 70 // the free quota (10,000 neurons) gave ~80 images on day one; keep a margin
const MODEL = '@cf/black-forest-labs/flux-1-schnell'

const STYLE =
  'Editorial illustration, calm and minimal, warm golden-hour light, muted palette of sand beige, deep forest green, ' +
  'sage, olive and soft terracotta. Soft painterly texture, clean uncluttered composition, wide landscape framing. ' +
  'No text, no letters, no numbers, no logos, no brand marks, no human faces, no recognizable people.'

const SCENE_SYSTEM = `You write short visual scene descriptions for illustrations that go with tech news stories.
Return JSON only: {"scenes":[{"id":"<id>","scene":"<description>"}]}.
Each scene is 15 to 30 words: concrete objects and a setting that symbolize the story.
Never name real people, companies, brands, products or places. Never ask for text, logos, screens with words, or faces.
People may appear only as small distant silhouettes seen from behind.
For car stories show a generic modern electric car without logos. For robot stories show a generic humanoid robot.
Vary the scenes; avoid cliches like glowing brains.`

type Story = { id: string; title: string; dek: string | null; topic: string; area: string | null }

Deno.serve(async (req) => {
  if (!(await authorized(req))) return json({ error: 'unauthorized' }, 401)
  const account = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')
  const token = Deno.env.get('CLOUDFLARE_API_TOKEN')
  if (!account || !token) return json({ error: 'CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN are not set' }, 500)
  const body = await req.json().catch(() => ({}))
  const sb = db()
  const log: string[] = []

  // Daily cap (UTC day), shared by both modes.
  const dayStart = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z').toISOString()
  const { count: today } = await sb
    .from('images').select('id', { count: 'exact', head: true }).contains('tags', ['ai']).gte('created_at', dayStart)
  const left = Math.max(0, DAILY_CAP - (today ?? 0))
  if (!left) return json({ ok: true, log: ['daily cap reached'] })

  if (body?.mode === 'library') {
    const n = Math.min(Number(body.count ?? 3), PER_RUN, left)
    const fake: Story[] = Array.from({ length: n }, (_, i) => ({
      id: `lib-${i}`, title: `A general news illustration about ${body.area ?? body.topic}`, dek: null,
      topic: body.topic, area: body.area ?? null,
    }))
    const scenes = await writeScenes(fake)
    for (const s of fake) {
      try {
        const url = await draw(account, token, scenes[s.id], `library/${s.topic}/${s.area ?? 'general'}-${crypto.randomUUID().slice(0, 8)}.jpg`)
        await sb.from('images').insert({ path: url, topic: s.topic, tags: ['ai', 'library', ...(s.area ? [s.area] : [])], alt: scenes[s.id] })
        log.push(`library ${s.topic}/${s.area}: ok`)
      } catch (e) {
        log.push(`library ${s.topic}/${s.area}: ${(e as Error).message}`)
      }
    }
    return json({ ok: true, log })
  }

  // Stories mode: newest important stories first, from the last 7 days, without a generated image yet.
  const since = new Date(Date.now() - 7 * 24 * 3600_000).toISOString()
  const { data, error } = await sb
    .from('stories')
    .select('id, title, dek, topic, area, images(tags)')
    .in('status', ['published', 'pending_review'])
    .gte('last_article_at', since)
    .order('importance', { ascending: false })
    .order('last_article_at', { ascending: false })
    .limit(200)
  if (error) return json({ error: error.message }, 500)
  // deno-lint-ignore no-explicit-any
  const todo: Story[] = (data ?? []).filter((s: any) => !s.images?.tags?.includes('generated')).slice(0, Math.min(PER_RUN, left))
  if (!todo.length) return json({ ok: true, log: ['nothing to draw'] })

  let scenes: Record<string, string>
  try {
    scenes = await writeScenes(todo)
  } catch (e) {
    return json({ ok: false, log: [`scene writer failed: ${(e as Error).message}`] })
  }

  for (const s of todo) {
    try {
      const url = await draw(account, token, scenes[s.id] ?? fallbackScene(s), `stories/${s.id}.jpg`)
      const { data: img, error: insErr } = await sb
        .from('images')
        .insert({ path: url, topic: s.topic, tags: ['ai', 'generated', ...(s.area ? [s.area] : [])], alt: scenes[s.id] ?? null })
        .select('id').single()
      if (insErr) throw new Error(insErr.message)
      await sb.from('stories').update({ image_id: img.id }).eq('id', s.id)
      log.push(`${s.id.slice(0, 8)}: ok`)
    } catch (e) {
      // The story keeps its library image and is retried next run.
      log.push(`${s.id.slice(0, 8)}: ${(e as Error).message}`)
      if (/daily free allocation/i.test((e as Error).message)) break // quota is over until 00:00 UTC
    }
  }
  return json({ ok: true, left: left - todo.length, log })
})

async function writeScenes(stories: Story[]): Promise<Record<string, string>> {
  const list = stories.map((s) => `- id: ${s.id}\n  topic: ${s.topic}${s.area ? ` / ${s.area}` : ''}\n  title: ${s.title}${s.dek ? `\n  dek: ${s.dek}` : ''}`).join('\n')
  const out = await generateJSON<{ scenes: { id: string; scene: string }[] }>({
    system: SCENE_SYSTEM,
    prompt: `Write one scene for each story:\n${list}`,
    temperature: 0.8,
  })
  return Object.fromEntries((out.scenes ?? []).map((x) => [x.id, x.scene]))
}

function fallbackScene(s: Story) {
  return s.topic === 'tesla'
    ? 'A generic modern electric car parked by a quiet coastal road at sunset, wind turbines on distant hills'
    : 'An abstract landscape of soft geometric shapes and circuit-like paths under a warm evening sky'
}

async function draw(account: string, token: string, scene: string, path: string): Promise<string> {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${MODEL}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    signal: AbortSignal.timeout(40000),
    body: JSON.stringify({ prompt: `${scene}. ${STYLE}`, steps: 4 }),
  })
  if (!res.ok) throw new Error(`Cloudflare ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  const b64: string | undefined = data?.result?.image
  if (!b64) throw new Error('Cloudflare returned no image')
  const bytes = shrink(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)))
  const sb = db()
  const { error } = await sb.storage.from('images').upload(path, bytes, { contentType: 'image/jpeg', upsert: true })
  if (error) throw new Error(`upload: ${error.message}`)
  return sb.storage.from('images').getPublicUrl(path).data.publicUrl
}

// FLUX returns a 1024x1024 JPEG of ~500KB. Crop to 4:3, scale to 800x600 and re-encode (~50KB),
// so the free 1GB storage holds many months of images.
const OUT_W = 800
const OUT_H = 600
function shrink(input: Uint8Array): Uint8Array {
  const img = jpeg.decode(input, { useTArray: true, formatAsRGBA: true })
  const sw = img.width, sh = img.height, src = img.data
  const cropH = Math.round((sw * OUT_H) / OUT_W)
  const oy = Math.max(0, Math.round((sh - cropH) / 2))
  const out = new Uint8Array(OUT_W * OUT_H * 4)
  const fx = sw / OUT_W, fy = Math.min(cropH, sh) / OUT_H
  for (let y = 0; y < OUT_H; y++) {
    const syf = oy + (y + 0.5) * fy - 0.5
    const y0 = Math.max(0, Math.floor(syf)), y1 = Math.min(sh - 1, y0 + 1), wy = syf - y0
    for (let x = 0; x < OUT_W; x++) {
      const sxf = (x + 0.5) * fx - 0.5
      const x0 = Math.max(0, Math.floor(sxf)), x1 = Math.min(sw - 1, x0 + 1), wx = sxf - x0
      const a = (y0 * sw + x0) * 4, b = (y0 * sw + x1) * 4, c = (y1 * sw + x0) * 4, d = (y1 * sw + x1) * 4
      const o = (y * OUT_W + x) * 4
      for (let k = 0; k < 3; k++) {
        out[o + k] = (src[a + k] * (1 - wx) + src[b + k] * wx) * (1 - wy) + (src[c + k] * (1 - wx) + src[d + k] * wx) * wy
      }
      out[o + 3] = 255
    }
  }
  return new Uint8Array(jpeg.encode({ data: out, width: OUT_W, height: OUT_H }, 74).data)
}
