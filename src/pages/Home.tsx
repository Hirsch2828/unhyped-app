import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { briefItems, buildHome, homeChips, type HomeRow } from '../lib/feed'
import { usePrefs } from '../lib/prefs'
import { useStories } from '../lib/stories'
import { topicInfo } from '../data/topics'
import type { Story } from '../data/types'
import HeroCarousel from '../components/HeroCarousel'
import { CompactRow, ImageScope, Row, SectionHeader, StoryCard, plural } from '../components/ui'

const ROW_PREVIEW = 10

export default function Home() {
  const { prefs } = usePrefs()
  useStories()
  const [params, setParams] = useSearchParams()
  const chips = homeChips(prefs.topics, prefs.depth)
  const filter = chips.some((c) => c.id === params.get('f')) ? params.get('f')! : 'all'
  const { heroes, must, rows } = buildHome(prefs.topics, prefs.depth, prefs.areas, filter)
  const brief = briefItems(prefs.topics)
  const q = filter === 'all' ? '' : `?f=${filter}`
  const pick = (id: string) => setParams(id === 'all' ? {} : { f: id }, { replace: true })

  // Each story appears once on the page. Priority: Top > Most relevant > Trending > Latest > the rest.
  const shown = new Set(heroes.map((s) => s.id))
  const take = (items: Story[], n: number) => {
    const out = items.filter((s) => !shown.has(s.id)).slice(0, n)
    out.forEach((s) => shown.add(s.id))
    return out
  }
  const byId = (id: string) => rows.find((r) => r.id === id)
  const relevantRow = byId('relevant')
  const now = byId('trending-now')
  const trendRow = now && now.items.length >= 3 ? now : byId('trending') ?? now
  const latestRow = byId('latest')
  const relevant = take(relevantRow?.items ?? [], 3)
  // A numbered list needs at least three entries; otherwise those stories flow into Latest.
  const trendCandidates = (trendRow?.items ?? []).filter((s) => !shown.has(s.id))
  const trending = trendCandidates.length >= 3 ? take(trendCandidates, 5) : []
  const latest = take(latestRow?.items ?? [], 6)
  const mustKnow = take(must, 6)
  const rest = rows
    .filter((r) => !['relevant', 'latest', trendRow?.id].includes(r.id))
    .map((r): HomeRow & { preview: Story[] } => ({ ...r, preview: take(r.items, ROW_PREVIEW) }))
    .filter((r) => r.preview.length >= 2)
  const topicNames = prefs.topics.map((t) => topicInfo[t].name).join(' & ')

  return (
    <ImageScope>
      <div className="fade-in space-y-10 pb-2 sm:pt-6">
        <HeroCarousel stories={heroes} />

        <nav aria-label="Filter by area" className="-mt-4">
          <div className="no-scrollbar fade-right flex gap-2 overflow-x-auto px-6 pr-12 sm:px-8">
            {chips.map((c) => (
              <button key={c.id} onClick={() => pick(c.id)} aria-pressed={filter === c.id} className="press flex h-11 shrink-0 items-center">
                <span
                  className={`flex h-9 items-center rounded-full border px-4 text-[14px] font-medium ${
                    filter === c.id ? 'border-forest bg-forest text-sand' : 'border-rule text-charcoal-500 hover:border-charcoal/30 hover:text-charcoal'
                  }`}
                >
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </nav>

        <Link to="/brief" className="press group mx-6 flex items-center gap-4 rounded-card bg-forest px-5 py-5 text-sand sm:mx-8 sm:px-7">
          <span className="min-w-0 flex-1">
            <span className="t-eyebrow block text-olive">Today’s briefing</span>
            <span className="t-h2 mt-1.5 block">Your 5-minute read</span>
            <span className="t-meta mt-1.5 block text-sand/75">
              {plural(brief.length, 'story', 'stories')} · ~5 min · {topicNames}
            </span>
          </span>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-sand/30 transition group-hover:bg-sand group-hover:text-forest">
            <ArrowRight className="h-5 w-5" />
          </span>
        </Link>

        {relevant.length > 0 && (
          <section>
            <SectionHeader title="Most relevant for you" seeAll={`/c/relevant${q}`} />
            <div className="px-6 sm:grid sm:grid-cols-[1.2fr_1fr] sm:gap-8 sm:px-8">
              <StoryCard story={relevant[0]} wide />
              <div className="mt-4 sm:mt-0">
                {relevant.slice(1).map((s) => (
                  <CompactRow key={s.id} story={s} thumb />
                ))}
              </div>
            </div>
          </section>
        )}

        {trending.length > 0 && trendRow && (
          <section>
            <SectionHeader title={trendRow.title} seeAll={trendRow.items.length > 5 ? `/c/${trendRow.id}${q}` : undefined} />
            <ol className="px-6 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:px-8">
              {trending.map((s, i) => (
                <li key={s.id}>
                  <CompactRow
                    story={s}
                    lead={<span className="w-8 shrink-0 font-serif text-[40px] font-semibold leading-[36px] text-olive tnum">{i + 1}</span>}
                  />
                </li>
              ))}
            </ol>
          </section>
        )}

        {latest.length > 0 && (
          <section>
            <SectionHeader title="Latest" seeAll={`/c/latest${q}`} />
            <div className="px-6 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:px-8">
              {latest.map((s) => (
                <CompactRow key={s.id} story={s} />
              ))}
            </div>
          </section>
        )}

        {mustKnow.length > 0 && (
          <Row title="Must know today">
            {mustKnow.map((s) => (
              <StoryCard key={s.id} story={s} />
            ))}
          </Row>
        )}

        {rest.map((r) => (
          <Row key={r.id} title={r.title} subtitle={r.id === 'rumors' ? r.subtitle : undefined} seeAll={r.items.length > r.preview.length ? `/c/${r.id}${q}` : undefined}>
            {r.preview.map((s) => (
              <StoryCard key={s.id} story={s} />
            ))}
          </Row>
        ))}

        {!heroes.length && <p className="px-6 text-center text-charcoal-500 sm:px-8">No stories here this week yet. Try another area.</p>}

        <div className="mx-6 border-t border-rule pt-6 text-center sm:mx-8">
          <p className="font-serif text-[19px] font-semibold italic text-charcoal">You’re all caught up.</p>
          <p className="t-meta mt-1 text-charcoal-400">New stories arrive through the day.</p>
        </div>
      </div>
    </ImageScope>
  )
}
