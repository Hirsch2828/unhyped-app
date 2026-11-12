import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, ExternalLink, Lightbulb, Share2 } from 'lucide-react'
import { findStory, useStories } from '../lib/stories'
import { usePrefs } from '../lib/prefs'
import { timeAgo } from '../lib/feed'
import { LabelTag, Row, SaveButton, StoryCard, TopicPill, labelHint, StoryImg } from '../components/ui'
import SignupSheet from '../components/SignupSheet'

export default function StoryPage() {
  const { id = '' } = useParams()
  const { stories } = useStories()
  const story = findStory(id)
  const nav = useNavigate()
  const { prefs, markRead } = usePrefs()
  const [sheet, setSheet] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (story) markRead(story.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, !!story])

  if (!story)
    return (
      <div className="p-8 text-center text-charcoal-500">
        Story not found. <Link to="/" className="text-forest underline">Back home</Link>
      </div>
    )

  const onSaved = () => {
    if (!prefs.email && !prefs.signupDismissed) setSheet(true)
  }
  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: story.title, url })
      else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      }
    } catch {
      /* user cancelled */
    }
  }
  const related = stories.filter((s) => s.id !== story.id && prefs.topics.includes(s.topic)).slice(0, 6)

  return (
    <article className="fade-in">
      <div className="mx-auto max-w-3xl sm:px-8 sm:pt-6">
        <div className="relative">
          <StoryImg story={story} className="h-72 w-full sm:h-[380px] sm:rounded-3xl" />
          <div className="absolute inset-x-0 top-0 flex justify-between p-3 sm:p-4">
            <button
              onClick={() => (window.history.length > 1 ? nav(-1) : nav('/'))}
              className="grid h-10 w-10 place-items-center rounded-full bg-sand-50/90 text-charcoal backdrop-blur"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="rounded-full bg-sand-50/90 backdrop-blur">
              <SaveButton story={story} onSaved={onSaved} className="h-10 w-10" />
            </span>
          </div>
        </div>

        <div className="px-4 pt-6 sm:px-0">
          <div className="flex flex-wrap items-center gap-2 text-sm text-charcoal-500">
            <TopicPill topic={story.topic} />
            <span>{story.hoursAgo < 24 ? `${story.time} · Today` : timeAgo(story.hoursAgo)}</span>
          </div>
          <h1 className="mt-3 font-serif text-[2rem] font-semibold leading-tight sm:text-5xl">{story.title}</h1>
          <p className="mt-3 text-lg leading-relaxed text-charcoal-500">{story.dek}</p>

          <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-xl border border-sand-300/70 bg-sand-50 p-3">
              <p className="font-medium">
                <LabelTag label={story.label} />
              </p>
              <p className="mt-0.5 text-xs text-charcoal-400">{story.mergedCount} sources</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-sand-300/70 bg-sand-50 p-3">
              <Clock className="h-4 w-4 shrink-0 text-charcoal-500" />
              <span>
                <span className="block font-medium">{story.readMinutes} min</span>
                <span className="block text-xs text-charcoal-400">read</span>
              </span>
            </div>
            <button onClick={share} className="flex items-center gap-2 rounded-xl border border-sand-300/70 bg-sand-50 p-3 text-left hover:bg-sand-200">
              <Share2 className="h-4 w-4 shrink-0 text-charcoal-500" />
              <span className="font-medium">{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>
          <p className="mt-2 text-xs text-charcoal-400">{labelHint(story.label)}</p>

          <section className="mt-8">
            <h2 className="font-serif text-2xl font-semibold">Key takeaways</h2>
            <ul className="mt-3 space-y-2 text-charcoal-500">
              {story.takeaways.map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-charcoal" />
                  {t}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="font-serif text-2xl font-semibold">Why it matters</h2>
            <div className="mt-3 flex gap-4 rounded-2xl bg-sand-200/70 p-5">
              <Lightbulb className="h-7 w-7 shrink-0 text-honey" strokeWidth={1.5} />
              <p className="leading-relaxed">{story.whyItMatters}</p>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="font-serif text-2xl font-semibold">What happened</h2>
            <div className="mt-3 space-y-3 leading-relaxed text-charcoal-500">
              {story.whatHappened
                .split(/\n\s*\n/)
                .filter(Boolean)
                .map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
            </div>
            {story.sources[0]?.url && (
              <a
                href={story.sources[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:text-terra-600"
              >
                Read the full article on {story.sources[0].name} <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </section>

          {story.marketReaction && (
            <section className="mt-8 rounded-2xl border border-sand-300/70 bg-sand-50 p-5">
              <h2 className="font-serif text-xl font-semibold">How the market reacted</h2>
              <p className="mt-2 leading-relaxed text-charcoal-500">{story.marketReaction}</p>
              <p className="mt-3 text-xs text-charcoal-400">Unhyped reports what happened. We never give buy or sell advice.</p>
            </section>
          )}

          <section className="mt-8">
            <h2 className="font-serif text-2xl font-semibold">Sources</h2>
            <p className="mt-1 text-sm text-charcoal-400">{story.mergedCount} articles merged into this one story.</p>
            <ul className="mt-3 divide-y divide-sand-300/70 overflow-hidden rounded-2xl border border-sand-300/70 bg-sand-50">
              {story.sources.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start justify-between gap-4 p-4 transition hover:bg-sand-200/60"
                  >
                    <div className="min-w-0">
                      <p className="inline-flex items-center gap-1.5 font-medium group-hover:text-forest">
                        {s.name} <ExternalLink className="h-3.5 w-3.5 text-charcoal-400" />
                      </p>
                      <p className="text-sm text-charcoal-500">{s.claim}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-sand-200 px-2.5 py-0.5 text-xs text-charcoal-500">{s.kind}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-12">
          <Row title="More like this">
            {related.map((s) => (
              <StoryCard key={s.id} story={s} />
            ))}
          </Row>
        </div>
      )}

      {sheet && <SignupSheet onClose={() => setSheet(false)} />}
    </article>
  )
}
