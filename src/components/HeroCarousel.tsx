import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Story } from '../data/types'
import { CategoryBadge, MetaRow, StoryImg } from './ui'

const ROTATE_MS = 7000

// Top stories, one slide at a time. Swipe or tap the progress line; it rotates by itself
// unless the reader is touching it or prefers reduced motion.
export default function HeroCarousel({ stories }: { stories: Story[] }) {
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const auto = !paused && !reduced && stories.length > 1

  const go = (i: number) => {
    const el = track.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: reduced ? 'auto' : 'smooth' })
  }

  // Keep the progress line in sync with manual swipes.
  const onScroll = () => {
    const el = track.current
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth))
  }

  useEffect(() => {
    if (!auto) return
    const t = setTimeout(() => go((index + 1) % stories.length), ROTATE_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, auto, stories.length])

  // A new filter brings new slides: start from the first one.
  const key = stories.map((s) => s.id).join()
  useEffect(() => {
    track.current?.scrollTo({ left: 0 })
    setIndex(0)
  }, [key])

  if (!stories.length) return null

  return (
    <section
      className="relative sm:mx-8"
      aria-roledescription="carousel"
      aria-label="Top stories"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div ref={track} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
        {stories.map((s, i) => (
          <Link
            key={s.id}
            to={`/story/${s.id}`}
            className="group flex w-full shrink-0 snap-start flex-col sm:grid sm:grid-cols-[1.25fr_1fr] sm:items-center sm:gap-10"
            aria-label={s.title}
            aria-roledescription="slide"
            tabIndex={i === index ? 0 : -1}
          >
            <StoryImg story={s} size="lg" className="aspect-[16/10] w-full sm:rounded-media" imgClassName="transition duration-700 group-hover:scale-[1.02]" />
            <div className="px-6 pt-6 sm:px-0 sm:pt-0">
              <p className="t-eyebrow flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-terra-ink">{i === 0 ? 'Top story' : `Top story · ${i + 1}`}</span>
                <CategoryBadge story={s} />
              </p>
              <h1 className="t-display mt-2.5 text-charcoal group-hover:text-forest sm:text-[42px] sm:leading-[48px]">{s.title}</h1>
              <p className="mt-2.5 text-[16px] leading-[24px] text-charcoal-500 sm:text-[18px] sm:leading-[28px]">{s.dek}</p>
              <div className="mt-3">
                <MetaRow story={s} />
              </div>
            </div>
          </Link>
        ))}
      </div>
      {stories.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[16/10] sm:w-[calc((100%-40px)*1.25/2.25)]">
          <div className="pointer-events-auto absolute inset-x-6 bottom-1 flex gap-1.5 sm:inset-x-4">
            {stories.map((s, i) => (
              <button key={s.id} onClick={() => go(i)} aria-label={`Show top story ${i + 1}`} aria-current={i === index} className="flex h-8 flex-1 items-center">
                <span className="block h-[2px] w-full overflow-hidden rounded-full bg-sand/40 shadow-[0_0_2px_rgb(0_0_0/0.25)]">
                  {i < index && <span className="block h-full w-full bg-sand" />}
                  {i === index && (
                    <span
                      key={`${index}-${auto}`}
                      className={`block h-full w-full bg-sand ${auto ? 'hero-progress' : ''}`}
                      style={auto ? { animationDuration: `${ROTATE_MS}ms` } : undefined}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
