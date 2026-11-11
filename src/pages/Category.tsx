import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { buildHome } from '../lib/feed'
import { usePrefs } from '../lib/prefs'
import { StoryCard } from '../components/ui'

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
    <div className="px-4 pt-4 sm:px-8 sm:pt-6">
      <Link to={back} className="inline-flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-charcoal">
        <ArrowLeft className="h-4 w-4" /> Home
      </Link>
      {row ? (
        <>
          <h1 className="mt-3 font-serif text-3xl text-charcoal">{row.title}</h1>
          {row.subtitle && <p className="mt-1 text-charcoal-500">{row.subtitle}</p>}
          <p className="mt-1 text-sm text-charcoal-400">
            {row.items.length} {row.items.length === 1 ? 'story' : 'stories'} from the last 7 days
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>a]:w-full [&>a]:max-w-none">
            {row.items.map((s) => (
              <StoryCard key={s.id} story={s} />
            ))}
          </div>
          <p className="py-8 text-center text-xs text-charcoal-400">You're all caught up.</p>
        </>
      ) : (
        <p className="mt-6 text-charcoal-500">Nothing here right now.</p>
      )}
    </div>
  )
}
