import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Share2 } from 'lucide-react'
import { findStory, useStories } from '../lib/stories'
import { usePrefs } from '../lib/prefs'
import { timeAgo } from '../lib/feed'
import { CategoryBadge, CompactRow, ImageScope, SaveButton, StoryImg, TrustMark, plural } from '../components/ui'
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
  const others = stories.filter((s) => s.id !== story.id && prefs.topics.includes(s.topic))
  const related = [
    ...others.filter((s) => s.area && s.area === story.area),
    ...others.filter((s) => s.topic === story.topic && s.area !== story.area),
  ].slice(0, 8)

  return (
    <ImageScope>
      <article className="fade-in">
        <div className="mx-auto max-w-3xl sm:px-8 sm:pt-6">
          <figure>
            <div className="relative">
              <StoryImg story={story} size="lg" className="aspect-[16/10] w-full sm:aspect-[16/9] sm:rounded-media" />
              <div className="absolute inset-x-0 top-0 flex justify-between p-3 sm:p-4">
                <button
                  onClick={() => (window.history.length > 1 ? nav(-1) : nav('/'))}
                  className="press relative grid h-10 w-10 place-items-center rounded-full bg-sand/85 text-charcoal before:absolute before:-inset-1 before:content-['']"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-sand/85">
                  <SaveButton story={story} onSaved={onSaved} className="!text-charcoal" />
                </span>
              </div>
            </div>
            {story.illustration && (
              <figcaption className="t-meta mt-2 px-6 text-charcoal-400 sm:px-0">Illustration · not a photo of the event</figcaption>
            )}
          </figure>

          <div className="px-6 pt-6 sm:px-0">
            <div className="t-meta flex flex-wrap items-center gap-x-2 gap-y-1 text-charcoal-400">
              <CategoryBadge story={story} />
            </div>
            <h1 className="t-display mt-3 text-charcoal sm:text-[44px] sm:leading-[50px]">{story.title}</h1>
            <p className="mt-3 text-[18px] leading-[28px] text-charcoal-500">{story.dek}</p>

            <div className="mt-6 flex items-center justify-between gap-3 border-y border-rule py-1.5">
              <span className="t-meta flex flex-wrap items-center gap-x-2 gap-y-1 text-charcoal-400">
                <TrustMark label={story.label} explain />
                <span aria-hidden>·</span>
                <span>{timeAgo(story.hoursAgo)}</span>
                <span aria-hidden>·</span>
                <span>{plural(story.mergedCount, 'source')}</span>
                <span aria-hidden>·</span>
                <span>{story.readMinutes} min</span>
              </span>
              <button onClick={share} className="press -mr-2 inline-flex h-11 items-center gap-2 px-2 t-meta text-charcoal-500 hover:text-charcoal" aria-label="Share this story">
                {copied ? 'Link copied' : null}
                <Share2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </button>
            </div>

            <section className="mt-8 border-l-[3px] border-honey pl-4">
              <p className="t-eyebrow text-honey-ink">Why it matters</p>
              <p className="mt-2 text-[18px] font-medium leading-[28px] text-charcoal">{story.whyItMatters}</p>
            </section>

            <section className="mt-10">
              <h2 className="t-eyebrow border-t border-rule pt-4 text-sage-ink">Key points</h2>
              <ul className="mt-3 space-y-3 text-[17px] leading-[28px] text-charcoal/85">
                {story.takeaways.map((t) => (
                  <li key={t} className="flex gap-3">
                    <span aria-hidden className="shrink-0 font-medium text-olive-ink">–</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-10">
              <h2 className="t-eyebrow border-t border-rule pt-4 text-sage-ink">What happened</h2>
              <div className="mt-3 space-y-5 text-[17px] leading-[28px] text-charcoal/85">
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
                  className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 text-[14px] font-medium text-forest underline decoration-rule underline-offset-4 hover:decoration-forest"
                >
                  Read the original <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </section>

            {story.marketReaction && (
              <section className="mt-10">
                <h2 className="t-eyebrow border-t border-rule pt-4 text-sage-ink">How the market reacted</h2>
                <p className="mt-2 text-charcoal-500">{story.marketReaction}</p>
                <p className="t-meta mt-3 text-charcoal-400">Unhyped reports what happened. We never give buy or sell advice.</p>
              </section>
            )}

            <section className="mt-10">
              <h2 className="t-eyebrow border-t border-rule pt-4 text-sage-ink">Sources</h2>
              <p className="t-meta mt-1.5 text-charcoal-400">
                {story.sources.length < story.mergedCount
                  ? `${story.sources.length} of ${plural(story.mergedCount, 'article')} merged into this story`
                  : `${plural(story.mergedCount, 'article')} merged into this story`}
              </p>
              <ul className="mt-3 border-b border-rule">
                {story.sources.map((s) => (
                  <li key={s.name + s.url}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex min-h-[56px] items-center gap-3 border-t border-rule py-3"
                    >
                      <SourceIcon url={s.url} name={s.name} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium leading-5 text-charcoal group-hover:text-forest">{s.name}</span>
                        <span className="t-meta block text-charcoal-400">{s.kind}</span>
                      </span>
                      <ExternalLink className="h-4 w-4 shrink-0 text-charcoal-400 group-hover:text-forest" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mx-auto mt-12 max-w-3xl px-6 sm:px-8">
            <h2 className="t-h2 mb-1">More like this</h2>
            <div className="border-b border-rule">
              {related.slice(0, 4).map((s) => (
                <CompactRow key={s.id} story={s} thumb />
              ))}
            </div>
          </section>
        )}

        {sheet && <SignupSheet onClose={() => setSheet(false)} />}
      </article>
    </ImageScope>
  )
}

// Site icon next to each source (public favicon service), or the source's first letter when there is none.
function SourceIcon({ url, name }: { url: string; name: string }) {
  const [failed, setFailed] = useState(false)
  let host = ''
  try {
    host = new URL(url).hostname
  } catch {
    /* no usable url: show the monogram */
  }
  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full bg-sand-200 font-serif text-[13px] font-semibold text-forest">
      {host && !failed ? (
        <img src={`https://icons.duckduckgo.com/ip3/${host}.ico`} alt="" loading="lazy" className="h-4 w-4" onError={() => setFailed(true)} />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  )
}
