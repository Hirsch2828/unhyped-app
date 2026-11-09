import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, FileText, Layers, Lightbulb } from 'lucide-react'
import { feedFor, today } from '../lib/feed'
import { useStories } from '../lib/stories'
import { usePrefs } from '../lib/prefs'
import { topicInfo } from '../data/topics'
import { ArrowCircle, Img, LabelTag, TopicPill } from '../components/ui'

export default function Brief() {
  const { prefs } = usePrefs()
  useStories()
  const items = feedFor(prefs.topics, 'balanced')
    .filter((s) => s.label !== 'rumor')
    .sort((a, b) => b.importance - a.importance || a.hoursAgo - b.hoursAgo)
    .slice(0, 6)
  const rumors = feedFor(prefs.topics, 'everything').filter((s) => s.label === 'rumor')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 1)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const top = items[0]
  const side = items.slice(1, 4)
  const names = prefs.topics.map((t) => topicInfo[t].name)

  return (
    <div className="fade-in">
      <div className="sticky top-16 z-20 h-1 bg-sand-200">
        <div className="h-full bg-forest transition-[width]" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-8">
        <div className="grid items-center gap-8 md:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-charcoal-500">Your</p>
            <h1 className="font-serif text-5xl font-semibold leading-[1.02] sm:text-6xl">5-Minute Briefing</h1>
            <p className="mt-4 text-lg leading-snug text-charcoal-500">
              The {items.length} most important developments in your areas today, in context.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-2">
              {[
                { icon: FileText, a: `${items.length}`, b: 'stories' },
                { icon: Clock, a: '~5 min', b: 'read' },
                { icon: Layers, a: names.slice(0, 2).join(', '), b: names.length > 2 ? 'and more' : 'topics' },
              ].map((x) => (
                <div key={x.b} className="flex items-center gap-2 rounded-xl border border-sand-300/70 bg-sand-50 p-3">
                  <x.icon className="h-5 w-5 shrink-0 text-charcoal-500" strokeWidth={1.5} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{x.a}</span>
                    <span className="block text-xs text-charcoal-400">{x.b}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {top && (
            <div className="relative hidden h-[360px] md:block">
              <span className="absolute left-8 top-4 h-24 w-28 rounded-2xl bg-forest/80" />
              <span className="absolute -right-2 top-0 h-16 w-20 rounded-xl bg-terra" />
              <Link to={`/story/${top.id}`} className="group absolute left-14 top-8 z-10 h-[320px] w-[270px] overflow-hidden rounded-3xl shadow-xl">
                <Img src={top.image} className="h-full w-full" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4 text-white">
                  <span>
                    <span className="block text-[11px] uppercase tracking-wider text-white/80">Top story</span>
                    <span className="mt-1 block font-serif text-xl font-semibold leading-tight">{top.title}</span>
                  </span>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest">→</span>
                </span>
              </Link>
              <div className="absolute right-0 top-14 flex flex-col gap-3">
                {side.map((s) => (
                  <Img key={s.id} src={s.image} className="h-24 w-32 rounded-2xl shadow-md" />
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="mt-8 text-sm text-charcoal-400">{today()}</p>
        <ol className="relative mt-4 border-t border-sand-300/70 pt-6">
          <span className="absolute bottom-6 left-[13px] top-10 w-px bg-sand-300 sm:left-[15px]" aria-hidden />
          {items.map((s, i) => (
            <li key={s.id} className="relative mb-6 flex gap-3 border-b border-sand-300/50 pb-6 last:border-0 sm:gap-5">
              <span className="z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest text-sm text-sand-50 sm:h-8 sm:w-8">{i + 1}</span>
              <Link to={`/story/${s.id}`} className="group flex min-w-0 flex-1 flex-col gap-4 sm:flex-row">
                <Img src={s.image} className="h-40 w-full shrink-0 rounded-2xl sm:h-36 sm:w-48" />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 text-sm text-charcoal-400">
                    <TopicPill topic={s.topic} /> {s.time} · <LabelTag label={s.label} />
                  </span>
                  <span className="mt-2 block font-serif text-2xl font-semibold leading-snug">{s.title}</span>
                  <span className="mt-1 block text-charcoal-500">{s.dek}</span>
                  <span className="mt-3 flex gap-3 rounded-xl bg-sand-200/70 p-3 text-sm">
                    <Lightbulb className="h-5 w-5 shrink-0 text-honey" strokeWidth={1.5} />
                    <span>
                      <b className="font-semibold">Why it matters: </b>
                      <span className="text-charcoal-500">{s.whyItMatters}</span>
                    </span>
                  </span>
                </span>
                <span className="hidden self-center sm:block">
                  <ArrowCircle />
                </span>
              </Link>
            </li>
          ))}
        </ol>

        {rumors.length > 0 && (
          <section className="rounded-2xl border border-honey/30 bg-honey-100/50 p-5">
            <h2 className="font-serif text-xl font-semibold">You may also see this today</h2>
            <p className="mt-1 text-sm text-charcoal-500">Unconfirmed. Listed so you know not to take it as fact.</p>
            <ul className="mt-4 space-y-3">
              {rumors.map((s) => (
                <li key={s.id}>
                  <Link to={`/story/${s.id}`} className="flex items-start gap-3 hover:underline">
                    <span className="shrink-0 text-sm"><LabelTag label="rumor" /></span>
                    <span>{s.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="my-14 text-center">
          <p className="font-serif text-3xl font-semibold">That’s everything.</p>
          <p className="mt-1 text-charcoal-500">You’re up to date. See you tomorrow.</p>
        </div>
      </div>
    </div>
  )
}
