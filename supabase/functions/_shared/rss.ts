// Minimal RSS 2.0 + Atom parser. No dependencies, so it runs the same in Deno and Node tests.

export interface FeedItem {
  url: string
  title: string
  summary: string
  publishedAt: string | null
  image: string | null
}

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, '&')

const stripHtml = (s: string) =>
  decode(s)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const tag = (block: string, name: string) => {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'))
  return m ? m[1] : ''
}

// The article's lead image, if the feed carries one: media:content / media:thumbnail,
// an image enclosure, or the first <img> inside the description or content.
const attr = (el: string, name: string) => decode(el.match(new RegExp(`\\s${name}=["']([^"']+)["']`, 'i'))?.[1] ?? '')
const isHttp = (u: string) => /^https?:\/\//i.test(u)
export function findImage(block: string): string | null {
  const media = block.match(/<media:(?:content|thumbnail)\b[^>]*>/gi) ?? []
  // Prefer the widest media:content that is an image.
  let best = ''
  let bestW = -1
  for (const el of media) {
    const url = attr(el, 'url')
    const type = attr(el, 'type') || attr(el, 'medium')
    if (!isHttp(url) || (type && !/image/i.test(type))) continue
    const w = Number(attr(el, 'width')) || 0
    if (w > bestW) (best = url), (bestW = w)
  }
  if (best) return best
  for (const el of block.match(/<enclosure\b[^>]*>/gi) ?? []) {
    const url = attr(el, 'url')
    if (isHttp(url) && /image/i.test(attr(el, 'type') || url)) return url
  }
  const html = decode(tag(block, 'content:encoded') + ' ' + tag(block, 'description') + ' ' + tag(block, 'content') + ' ' + tag(block, 'summary'))
  for (const el of html.match(/<img\b[^>]*>/gi) ?? []) {
    const url = attr(el, 'src')
    // Skip tracking pixels and tiny icons.
    if (!isHttp(url) || /pixel|feedburner|gravatar|emoji|\.gif(\?|$)/i.test(url)) continue
    const w = Number(attr(el, 'width'))
    if (w && w < 200) continue
    return url
  }
  return null
}

const toIso = (s: string) => {
  const d = new Date(decode(s).trim())
  return isNaN(d.getTime()) ? null : d.toISOString()
}

export function parseFeed(xml: string, maxItems = 30): FeedItem[] {
  const items: FeedItem[] = []
  const rss = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? []
  for (const b of rss) {
    const link = stripHtml(tag(b, 'link')) || stripHtml(tag(b, 'guid'))
    const title = stripHtml(tag(b, 'title'))
    if (!link || !title) continue
    items.push({
      url: link,
      title,
      summary: stripHtml(tag(b, 'description') || tag(b, 'content:encoded')).slice(0, 1200),
      publishedAt: toIso(tag(b, 'pubDate') || tag(b, 'dc:date')),
      image: findImage(b),
    })
  }
  if (items.length === 0) {
    const atom = xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ?? []
    for (const b of atom) {
      const alt = b.match(/<link[^>]*rel=["']alternate["'][^>]*>/i)?.[0] ?? b.match(/<link[^>]*>/i)?.[0] ?? ''
      const link = decode(alt.match(/href=["']([^"']+)["']/i)?.[1] ?? '')
      const title = stripHtml(tag(b, 'title'))
      if (!link || !title) continue
      items.push({
        url: link,
        title,
        summary: stripHtml(tag(b, 'summary') || tag(b, 'content')).slice(0, 1200),
        publishedAt: toIso(tag(b, 'published') || tag(b, 'updated')),
        image: findImage(b),
      })
    }
  }
  return items.slice(0, maxItems)
}

// Drop tracking params so the same article from two links dedupes.
export function normalizeUrl(u: string) {
  try {
    const url = new URL(u.trim())
    for (const k of [...url.searchParams.keys()]) if (/^(utm_|ref$|src$|cmpid$|fbclid$|gclid$)/i.test(k)) url.searchParams.delete(k)
    url.hash = ''
    return url.toString()
  } catch {
    return u.trim()
  }
}
