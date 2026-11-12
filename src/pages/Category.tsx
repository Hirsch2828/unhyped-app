import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { buildHome } from '../lib/feed'
import { usePrefs } from '../lib/prefs'
import { ImageScope, StoryCard, plural } from '../components/ui'

// "See all" page: every story of one home row, as a grid. Ends with a clear stop, no endless scroll.
export default function Category() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const { prefs } = usePrefs()
  const filter = params.get('f') ?? 'all'
  const { rows } = buildHome(prefs.topics, prefs.depth, prefs.areas, filter)
  const row = rows.find((r) => r.id === id)
  const back = filter === 'all' ? '/' : `/?f=${filter}`

  return (
    <ImageScope>
    <div className="fade-in px-6 pt-2 sm:px-8 sm:pt-6">
      <Link to={back} className="t-meta inline-flex min-h-[44px] items-center gap-1.5 text-charcoal-500 hover:text-charcoal">
        <ArrowLeft className="h-4 w-4" /> Home
      </Link>
      {row ? (
        <>
          <h1 className="t-display mt-1 text-charcoal">{row.title}</h1>
          <p className="t-meta mt-2 text-charcoal-400">
            {row.subtitle ? `${row.subtitle} · ` : ''}
            {plural(row.items.length, 'story', 'stories')} from the last 7 days
          </p>
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {row.items.map((s) => (
              <StoryCard key={s.id} story={s} wide />
            ))}
          </div>
          <p className="mt-10 border-t border-rule py-6 text-center font-serif text-[19px] font-semibold italic">You’re all caught up.</p>
        </>
      ) : (
        <p className="mt-6 text-charcoal-500">Nothing here right now.</p>
      )}
    </div>
    </ImageScope>
  )
}
