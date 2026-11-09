import { Link } from 'react-router-dom'
import { ArrowRight, ChevronRight, FileText, Pencil, Plus } from 'lucide-react'
import { buildHome } from '../lib/feed'
import { usePrefs } from '../lib/prefs'
import { useStories } from '../lib/stories'
import { topicInfo } from '../data/topics'
import { ArrowCircle, Img, LabelTag, MetaRow, Row, SectionHeader, StoryCard, TopicPill } from '../components/ui'

export default function Home() {
  const { prefs } = usePrefs()
  const { mode } = useStories()
  const { hero, must, rows } = buildHome(prefs.topics, prefs.depth, prefs.areas)
  const topicNames = prefs.topics.map((t) => topicInfo[t].name)

  return (
    <div className="space-y-8 pt-4 sm:space-y-10 sm:pt-6">
      {hero && (
        <Link to={`/story/${hero.id}`} className="group mx-4 block sm:mx-8" aria-label={hero.title}>
          <article className="fade-in relative overflow-hidden rounded-3xl bg-charcoal shadow-card">
            <Img src={hero.image} className="h-[420px] w-full object-[22%_center] sm:h-[480px] sm:-scale-x-100 sm:object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent sm:bg-gradient-to-r sm:from-black/85 sm:via-black/55 sm:to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:inset-y-0 sm:right-auto sm:flex sm:max-w-[620px] sm:flex-col sm:justify-center sm:p-12">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-terra px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">Top story</span>
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs backdrop-blur">{topicInfo[hero.topic].name}</span>
              </div>
              <h1 className="mt-3 text-[1.75rem] font-semibold leading-[1.1] sm:text-4xl lg:text-[2.75rem]">{hero.title}</h1>
              <p className="mt-2 text-white/85 sm:text-lg">{hero.dek}</p>
              <div className="mt-4 hidden border-l-2 border-terra pl-4 sm:block">
                <p className="text-sm font-semibold text-terra">Why it matters</p>
                <p className="mt-1 line-clamp-3 text-[0.95rem] leading-relaxed text-white/85">{hero.whyItMatters}</p>
              </div>
              <div className="mt-4 flex items-center justify-between gap-4">
                <MetaRow story={hero} light />
                <ArrowCircle dark />
              </div>
            </div>
          </article>
        </Link>
      )}

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

      <section>
        <SectionHeader
          title="Your topics"
          action={
            <Link to="/settings" className="inline-flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-charcoal">
              <Pencil className="h-4 w-4" /> Edit topics
            </Link>
          }
        />
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1 sm:px-8">
          {prefs.topics.map((t) => (
            <a
              key={t}
              href={`#row-${t}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(`row-${t}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="flex shrink-0 items-center gap-3 rounded-xl border border-sand-300/70 bg-sand-50 py-2 pl-2 pr-5 text-sm font-medium hover:border-sage"
            >
              <Img src={topicInfo[t].image} className="h-9 w-9 rounded-lg" />
              {topicInfo[t].name}
            </a>
          ))}
          <Link
            to="/settings"
            className="flex shrink-0 items-center gap-2 rounded-xl border border-dashed border-sand-300 px-5 py-2 text-sm text-charcoal-500 hover:text-charcoal"
          >
            <Plus className="h-4 w-4" /> Add topic
          </Link>
        </div>
      </section>

      {must.length > 0 && (
        <section className="fade-in">
          <SectionHeader title="Must know today" subtitle="The few that matter" />
          <ol className="mx-4 grid grid-cols-1 gap-3 sm:mx-8 lg:grid-cols-2">
            {must.map((s, i) => (
              <li key={s.id} className="min-w-0">
                <Link
                  to={`/story/${s.id}`}
                  className="group flex items-center gap-3 sm:gap-4 rounded-2xl border border-sand-300/70 bg-sand-50 p-3 transition hover:border-sage"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest text-sm text-sand-50">{i + 1}</span>
                  <Img src={s.image} className="h-20 w-20 shrink-0 rounded-xl sm:w-24" />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-charcoal-400">
                      <TopicPill topic={s.topic} /> <LabelTag label={s.label} />
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
        <div key={r.id} id={`row-${r.id}`} className="scroll-mt-20">
          <Row title={r.title} subtitle={r.subtitle}>
            {r.items.map((s) => (
              <StoryCard key={s.id} story={s} />
            ))}
          </Row>
        </div>
      ))}
      {/* AI has no dedicated row: anchor its chip to trending */}
      <span id="row-ai" className="hidden" />

      <p className="px-4 text-center text-xs text-charcoal-400 sm:px-8">{mode === 'live' ? "You're all caught up." : 'Sample stories for the demo. You are all caught up.'}</p>
    </div>
  )
}
