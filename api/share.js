// Share links: /s/<story id> (rewritten here by vercel.json).
// WhatsApp, X and iMessage don't run JavaScript or read what comes after "#", so the app's own story URL
// (/#/story/<id>) would preview as a blank page. This returns a tiny page with the story's title, label and
// image as Open Graph tags, and sends people straight on to the story in the app.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://wzttcpnjnhsdhpcdqfhz.supabase.co'
const SUPABASE_KEY = process.env.VITE_SUPABASE_KEY || 'sb_publishable_BIQXh3rsye-CVUnKXeKnsg_8TmQtRDm'

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const LABEL = { official: 'Official', report: 'Report', rumor: 'Rumor' }

export default async function handler(req, res) {
  const id = String(req.query.id || '')
  const origin = `https://${req.headers['x-forwarded-host'] || req.headers.host}`
  const target = /^[0-9a-f-]{36}$/.test(id) ? `${origin}/#/story/${id}` : `${origin}/`
  let title = 'Unhyped: AI news, minus the hype'
  let description = 'One story instead of six versions of it, with every claim sourced and labeled Official, Report or Rumor.'
  let image = `${origin}/og.png`
  if (target !== `${origin}/`) {
    try {
      const q = new URLSearchParams({
        select: 'title,why_it_matters,label,article_count,images(path),articles(image_url,sources(tier))',
        id: `eq.${id}`,
        status: 'eq.published',
      })
      const r = await fetch(`${SUPABASE_URL}/rest/v1/stories?${q}`, { headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${SUPABASE_KEY}` } })
      const [s] = r.ok ? await r.json() : []
      if (s) {
        title = `${LABEL[s.label] ?? 'Report'} · ${s.title}`
        description = `${s.why_it_matters} (${s.article_count} ${s.article_count === 1 ? 'source' : 'sources'})`
        const photos = (s.articles || []).filter((a) => a.image_url && a.image_url.startsWith('https://'))
        image = (photos.find((a) => a.sources?.tier === 'official') || photos[0])?.image_url || s.images?.path || image
      }
    } catch {
      /* fall back to the generic card */
    }
  }
  res.setHeader('content-type', 'text/html; charset=utf-8')
  res.setHeader('cache-control', 'public, s-maxage=600, stale-while-revalidate=86400')
  res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="article"><meta property="og:site_name" content="Unhyped">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(image)}"><meta property="og:url" content="${esc(`${origin}/s/${id}`)}">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url=${esc(target)}">
<link rel="canonical" href="${esc(target)}">
</head><body style="background:#F2F0E8;color:#171815;font-family:system-ui,sans-serif;padding:24px">
<p><a href="${esc(target)}">Open the story on Unhyped</a></p>
<script>location.replace(${JSON.stringify(target)})</script>
</body></html>`)
}
