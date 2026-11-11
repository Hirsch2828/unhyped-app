import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, ChevronRight, FileText } from 'lucide-react'
import { buildHome, homeChips } from '../lib/feed'
import { usePrefs } from '../lib/prefs'
import { useStories } from '../lib/stories'
import { topicInfo } from '../data/topics'
import HeroCarousel from '../components/HeroCarousel'
import { ArrowCircle, Icon, LabelTag, Row, SectionHeader, StoryCard, StoryImg, CategoryBadge, categoryOf } from '../components/ui'

const ROW_PREVIEW = 12

export default function Home() {
  const { prefs } = usePrefs()
  const { mode } = useStories()
  const [params, setParams] = useSearchParams()
  const chips = homeChips(prefs.topics, prefs.depth)
  const filter = chips.some((c) => c.id === params.get('f')) ? params.get('f')! : 'all'
  const { heroes, must, rows } = buildHome(prefs.topics, prefs.depth, prefs.areas, filter)
  const topicNames = prefs.topics.map((t) => topicInfo[t].name)
  const q = filter === 'all' ? '' : `?f=${filter}`

  const pick = (id: string) => setParams(id === 'all' ? {} : { f: id }, { replace: true })

  return (
    <div className="space-y-8 pt-4 sm:space-y-10 sm:pt-6">
      <HeroCarousel stories={heroes} />

      <nav aria-label="Filter by area" className="-mt-2 sm:-mt-4">
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1 sm:px-8">
          {chips.map((c) => (
            <button
              key={c.id}
              onClick={() => pick(c.id)}
              aria-pressed={filter === c.id}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                filter === c.id
                  ? 'border-forest bg-forest text-sand-50'
                  : 'border-sand-300/80 bg-sand-50 text-charcoal-500 hover:border-sage hover:text-charcoal'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {categoryOf(c.id) && <Icon name={categoryOf(c.id)!.icon} className="h-4 w-4" />}
                {c.name}
              </span>
            </button>
          ))}
        </div>
      </nav>

      <Link
        to="/brief"
        className="group mx-4 flex items-center gap-4 rounded-2xl border border-sand-300/70 bg-sand-50 p-4 shadow-card transition hover:border-terra/50 sm:mx-8 sm:p-5"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-terra text-white sm:h-14 sm:w-14">
          <FileText className="h-6 w-6" />
        </span>
        <span className="flex-1">
          <span className="block font-serif text-xl font-semibold">Your 5-Minute Briefing</span>
          <span className="block text-sm text-charcoal-500">
            Catch up on today’s top {topicNames.slice(0, 2).join(' and ')} updates, in a calm and clear summary.
          </span>
        </span>
        <span className="hidden items-center gap-2 rounded-full bg-terra px-5 py-3 text-sm font-medium text-white transition group-hover:bg-terra-600 md:inline-flex">
          Read your 5-minute brief <ArrowRight className="h-4 w-4" />
        </span>
        <ChevronRight className="h-5 w-5 text-charcoal-400 md:hidden" />
      </Link>

      {must.length > 0 && (
        <section className="fade-in">
          <SectionHeader title="Must know today" subtitle="The few that matter" />
          <ol className="mx-4 grid grid-cols-1 gap-3 sm:mx-8 lg:grid-cols-2">
            {must.map((s, i) => (
              <li key={s.id} className="min-w-0">
                <Link
                  to={`/story/${s.id}`}
                  className="group flex items-center gap-3 rounded-2xl border border-sand-300/70 bg-sand-50 p-3 transition hover:border-sage sm:gap-4"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest text-sm text-sand-50">{i + 1}</span>
                  <StoryImg story={s} mini className="h-20 w-20 shrink-0 rounded-xl sm:w-24" />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-charcoal-400">
                      <CategoryBadge story={s} className="!bg-sand-200/70 !shadow-none" /> <LabelTag label={s.label} />
                    </span>
                    <span className="mt-1 line-clamp-2 block font-serif text-[1.05rem] font-semibold leading-snug">{s.title}</span>
                  </span>
                  <span className="hidden sm:block">
                    <ArrowCircle />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {rows.map((r) => (
        <Row
          key={r.id}
          title={r.title}
          subtitle={r.subtitle}
          seeAll={r.items.length > 3 ? `/c/${r.id}${q}` : undefined}
        >
          {r.items.slice(0, ROW_PREVIEW).map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </Row>
      ))}

      {!heroes.length && (
        <p className="px-4 text-center text-charcoal-500 sm:px-8">No stories here this week yet. Try another area.</p>
      )}

      <p className="px-4 text-center text-xs text-charcoal-400 sm:px-8">
        {mode === 'live' ? "You're all caught up." : 'Sample stories for the demo. You are all caught up.'}
      </p>
    </div>
  )
}
