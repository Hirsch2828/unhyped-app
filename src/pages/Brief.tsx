import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { briefItems, feedFor } from '../lib/feed'
import { useStories } from '../lib/stories'
import { usePrefs } from '../lib/prefs'
import { topicInfo } from '../data/topics'
import { CategoryBadge, ImageScope, StoryImg, TrustMark, plural } from '../components/ui'

export default function Brief() {
  const { prefs } = usePrefs()
  useStories()
  const items = briefItems(prefs.topics)
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

  const names = prefs.topics.map((t) => topicInfo[t].name)

  return (
    <ImageScope>
      <div className="fade-in">
        <div className="sticky top-14 z-20 h-[2px] bg-transparent sm:top-16">
          <div className="h-full bg-forest" style={{ width: `${progress * 100}%` }} />
        </div>

        <div className="mx-auto max-w-3xl px-6 pt-6 sm:px-8 sm:pt-10">
          <h1 className="t-display sm:text-[44px] sm:leading-[50px]">Today in five minutes</h1>
          <p className="t-meta mt-2 text-charcoal-400">
            {plural(items.length, 'story', 'stories')} · ~5 min · {names.join(' & ')}
          </p>

          <ol className="mt-8 border-b border-rule">
            {items.map((s, i) => (
              <li key={s.id} className="flex gap-4 border-t border-rule pt-5">
                <span className="w-8 shrink-0 font-serif text-[44px] font-semibold leading-[40px] text-olive-ink tnum">{i + 1}</span>
                <Link to={`/story/${s.id}`} className="press group min-w-0 flex-1 pb-6">
                  {i === 0 && <StoryImg story={s} size="lg" className="mb-4 aspect-[16/10] w-full rounded-media" />}
                  <span className="flex gap-4">
                    <span className="min-w-0 flex-1">
                      <span className="t-meta flex flex-wrap items-center gap-x-2 gap-y-1 text-charcoal-400">
                        <CategoryBadge story={s} />
                        <span aria-hidden>·</span>
                        <TrustMark label={s.label} />
                      </span>
                      <span className={`mt-1.5 block text-charcoal group-hover:text-forest ${i === 0 ? 't-h1' : 't-card'}`}>{s.title}</span>
                    </span>
                    
                  </span>
                  {i === 0 && <span className="mt-2 block text-charcoal-500">{s.dek}</span>}
                  {i === 0 ? (
                    <span className="mt-4 block border-l-[3px] border-honey pl-3">
                      <span className="t-eyebrow block text-honey-ink">Why it matters</span>
                      <span className="mt-1 block text-[16px] leading-[25px] text-charcoal">{s.whyItMatters}</span>
                    </span>
                  ) : (
                    <span className="mt-2 block text-[15px] leading-[24px] text-charcoal-500">{s.whyItMatters}</span>
                  )}
                </Link>
              </li>
            ))}
          </ol>

          {rumors.length > 0 && (
            <section className="-mx-6 mt-10 border-t border-dashed border-honey/60 bg-honey-100/40 px-6 pb-4 pt-6 sm:mx-0 sm:px-6">
              <h2 className="t-h2">Also going around</h2>
              <p className="t-meta mt-1 text-honey-ink">Not confirmed. Read with care.</p>
              <ul className="mt-3">
                {rumors.map((s) => (
                  <li key={s.id}>
                    <Link to={`/story/${s.id}`} className="press group flex min-h-[44px] items-baseline gap-3 border-t border-rule py-3 first:border-0">
                      <span className="t-meta shrink-0 text-charcoal-400">
                        <TrustMark label="rumor" />
                      </span>
                      <span className="font-serif text-[17px] font-semibold leading-[22px] group-hover:text-forest">{s.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="my-12 border-t border-rule pt-6 text-center">
            <p className="font-serif text-[22px] font-semibold italic">You’re all caught up.</p>
            <p className="t-meta mt-1 text-charcoal-400">See you tomorrow.</p>
          </div>
        </div>
      </div>
    </ImageScope>
  )
}

