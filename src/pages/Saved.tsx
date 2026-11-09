import { Link } from 'react-router-dom'
import { Bookmark } from 'lucide-react'
import { useStories } from '../lib/stories'
import { usePrefs } from '../lib/prefs'
import { Img, MetaRow, SaveButton, TopicPill } from '../components/ui'

export default function Saved() {
  const { prefs } = usePrefs()
  const { stories } = useStories()
  const items = stories.filter((s) => prefs.saved.includes(s.id))

  return (
    <div className="fade-in mx-auto max-w-3xl px-4 pt-8 sm:px-8">
      <h1 className="font-serif text-4xl font-semibold">Saved</h1>
      <p className="mt-1 text-charcoal-500">Stories you want to come back to.</p>
      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-sand-300/70 bg-sand-50 p-10 text-center">
          <Bookmark className="mx-auto h-8 w-8 text-charcoal-400" strokeWidth={1.5} />
          <p className="mt-3 font-medium">Nothing saved yet</p>
          <p className="mt-1 text-sm text-charcoal-500">Tap the bookmark on any story to keep it here.</p>
          <Link to="/" className="mt-4 inline-block font-medium text-forest">Browse today’s stories →</Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((s) => (
            <li key={s.id}>
              <Link to={`/story/${s.id}`} className="flex gap-4 rounded-2xl border border-sand-300/70 bg-sand-50 p-3 hover:border-sage">
                <Img src={s.image} className="h-24 w-28 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <TopicPill topic={s.topic} />
                  <p className="line-clamp-2 font-serif text-lg font-semibold leading-snug">{s.title}</p>
                  <MetaRow story={s} />
                </div>
                <SaveButton story={s} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
