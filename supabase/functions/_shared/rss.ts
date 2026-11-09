// Minimal RSS 2.0 + Atom parser. No dependencies, so it runs the same in Deno and Node tests.

export interface FeedItem {
  url: string
  title: string
  summary: string
  publishedAt: string | null
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
