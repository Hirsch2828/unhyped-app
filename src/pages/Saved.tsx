import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Bookmark, BookmarkCheck } from 'lucide-react'
import { ensureStories, findStory, useStories } from '../lib/stories'
import { usePrefs } from '../lib/prefs'
import { CategoryBadge, ImageScope, MetaRow, StoryImg, plural } from '../components/ui'

function RemoveButton({ id }: { id: string }) {
  const { toggleSave } = usePrefs()
  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleSave(id)
      }}
      aria-label="Remove from saved"
      title="Remove from saved"
      className="press -my-3 -mr-3 grid h-11 w-11 shrink-0 place-items-center text-forest hover:text-charcoal"
    >
      <BookmarkCheck className="h-[18px] w-[18px]" fill="currentColor" strokeWidth={1.75} />
    </button>
  )
}

export default function Saved() {
  const { prefs } = usePrefs()
  const { mode } = useStories()
  // Saved stories can be older than the feed's 7 days: fetch those by id.
  useEffect(() => {
    if (mode === 'live') ensureStories(prefs.saved)
  }, [mode, prefs.saved])
  const items = [...prefs.saved].reverse().map(findStory).filter((s): s is NonNullable<typeof s> => !!s)

  return (
    <ImageScope>
      <div className="fade-in px-6 pt-6 sm:px-8 sm:pt-10">
        <h1 className="t-display">Saved</h1>
        <p className="text-[14px] leading-snug mt-2 text-charcoal-400">
          {items.length ? `${plural(items.length, 'story', 'stories')} · kept on this device` : 'Stories you want to come back to'}
        </p>
        {items.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <Bookmark className="h-10 w-10 text-olive" strokeWidth={1.25} />
            <p className="t-h2 mt-5">Nothing saved. That’s allowed.</p>
            <p className="text-[14px] leading-snug mt-2 max-w-[260px] text-charcoal-400">Tap the bookmark on any story and it waits for you here.</p>
            <Link to="/" className="press mt-6 inline-flex min-h-[44px] items-center gap-1.5 text-[15px] font-medium text-forest">
              Browse today’s stories <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-x-12 border-b border-rule lg:grid-cols-2">
            {items.map((s) => (
              <li key={s.id}>
                <Link to={`/story/${s.id}`} className="press group flex gap-4 border-t border-rule py-4">
                  <StoryImg story={s} mini className="mt-0.5 h-[76px] w-[76px] shrink-0 rounded-lg" />
                  <span className="min-w-0 flex-1">
                    <CategoryBadge story={s} />
                    <span className="mt-1 block font-serif text-[17px] font-semibold leading-[22px] group-hover:text-forest">{s.title}</span>
                    <span className="mt-2 flex items-center justify-between gap-3">
                      <MetaRow story={s} />
                      <RemoveButton id={s.id} />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ImageScope>
  )
}
