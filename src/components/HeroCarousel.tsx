import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Story } from '../data/types'
import { ArrowCircle, CategoryBadge, MetaRow, StoryImg } from './ui'

const ROTATE_MS = 7000

// Top stories, one slide at a time. Swipe or tap the dots; it rotates by itself
// unless the reader is touching it or prefers reduced motion.
export default function HeroCarousel({ stories }: { stories: Story[] }) {
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const go = (i: number) => {
    const el = track.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  // Keep the dots in sync with manual swipes.
  const onScroll = () => {
    const el = track.current
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth))
  }

  useEffect(() => {
    if (paused || stories.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setTimeout(() => go((index + 1) % stories.length), ROTATE_MS)
    return () => clearTimeout(t)
  }, [index, paused, stories.length])

  // A new filter brings new slides: start from the first one.
  const key = stories.map((s) => s.id).join()
  useEffect(() => {
    track.current?.scrollTo({ left: 0 })
    setIndex(0)
  }, [key])

  if (!stories.length) return null

  return (
    <section
      className="relative mx-4 sm:mx-8"
      aria-roledescription="carousel"
      aria-label="Top stories"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        ref={track}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-3xl bg-charcoal shadow-card"
      >
        {stories.map((s, i) => (
          <Link
            key={s.id}
            to={`/story/${s.id}`}
            className="group relative block w-full shrink-0 snap-start"
            aria-label={s.title}
            aria-roledescription="slide"
            tabIndex={i === index ? 0 : -1}
          >
            <StoryImg story={s} className="h-[440px] sm:h-[480px]" badgeTop />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/5 sm:bg-gradient-to-r sm:from-black/85 sm:via-black/55 sm:to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 pb-10 text-white sm:inset-y-0 sm:right-auto sm:flex sm:max-w-[620px] sm:flex-col sm:justify-center sm:p-12 [&>*]:shrink-0">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-terra px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                  {i === 0 ? 'Top story' : `Top ${i + 1}`}
                </span>
                <CategoryBadge story={s} />
              </div>
              <h1 className="mt-3 line-clamp-3 pb-0.5 sm:line-clamp-none text-[1.65rem] font-semibold leading-[1.12] sm:text-4xl lg:text-[2.6rem]">{s.title}</h1>
              <p className="mt-2 line-clamp-2 text-white/85 sm:text-lg">{s.dek}</p>
              <div className="mt-4 hidden border-l-2 border-terra pl-4 sm:block">
                <p className="text-sm font-semibold text-terra">Why it matters</p>
                <p className="mt-1 line-clamp-3 text-[0.95rem] leading-relaxed text-white/85">{s.whyItMatters}</p>
              </div>
              <div className="mt-4 flex items-center justify-between gap-4">
                <MetaRow story={s} light />
                <ArrowCircle dark />
              </div>
            </div>
          </Link>
        ))}
      </div>
      {stories.length > 1 && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {stories.map((s, i) => (
            <button
              key={s.id}
              onClick={() => go(i)}
              aria-label={`Show top story ${i + 1}`}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
