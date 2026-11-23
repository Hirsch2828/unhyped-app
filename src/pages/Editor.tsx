// Editor review queue (hidden page: #/editor). Only accounts with role = 'editor' can approve.
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Ban, Check, ExternalLink, LogOut, Pencil, RotateCcw, X } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { loadLive } from '../lib/stories'
import type { Label, Topic } from '../data/types'
import { Button, LabelTag, Logo, TopicPill } from '../components/ui'
import CompaniesReview from './editor/CompaniesReview'

interface QueueStory {
  id: string
  topic: Topic
  label: Label
  importance: number
  status: string
  title: string
  dek: string
  why_it_matters: string
  takeaways: string[]
  article_count: number
  last_article_at: string
  debunked: boolean | null
  debunk_note: string | null
  source_notes: { source: string; stance: string; note: string }[] | null
  articles: { url: string; title: string; sources: { name: string; tier: string } | null }[]
}

// Suggest "Debunked" when an official source differs from our summary.
const officialDiffers = (s: QueueStory) => {
  const official = new Set(s.articles.filter((a) => a.sources?.tier === 'official').map((a) => a.sources!.name))
  return (s.source_notes ?? []).find((n) => n.stance === 'differs' && official.has(n.source)) ?? null
}

const SELECT =
  'id,topic,label,importance,status,title,dek,why_it_matters,takeaways,article_count,last_article_at,debunked,debunk_note,source_notes,articles(url,title,sources(name,tier))'

export default function Editor() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [isEditor, setIsEditor] = useState(false)
  const [tab, setTab] = useState<'stories' | 'companies'>('stories')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return setIsEditor(false)
    supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setIsEditor(data?.role === 'editor'))
  }, [session])

  return (
    <div className="min-h-screen bg-sand">
      <header className="border-b border-sand-300/60 bg-sand/90">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Link to="/" aria-label="Back to app" className="text-charcoal-500 hover:text-charcoal">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Logo />
            <span className="rounded-md bg-forest px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-sand-50">Editor</span>
          </div>
          {session && (
            <button onClick={() => supabase.auth.signOut()} className="inline-flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-charcoal">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        {!ready ? null : !session ? (
          <SignIn />
        ) : !isEditor ? (
          <p className="rounded-2xl border border-sand-300/70 bg-sand-50 p-6 text-charcoal-500">
            Signed in as <b>{session.user.email}</b>. This account is not an editor yet.
          </p>
        ) : (
          <>
            <nav className="mb-8 flex gap-2" aria-label="Editor sections">
              {(['stories', 'companies'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  aria-current={tab === t ? 'page' : undefined}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === t ? 'bg-ink text-paper' : 'text-charcoal-500 hover:text-charcoal'}`}
                >
                  {t === 'stories' ? 'Stories' : 'Companies'}
                </button>
              ))}
            </nav>
            {tab === 'stories' ? <Queue /> : <CompaniesReview />}
          </>
        )}
      </main>
    </div>
  )
}

function SignIn() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    // Come back to this page after the email link (query code, then #/editor).
    localStorage.setItem('unhyped.afterLogin', '/editor')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + window.location.pathname, shouldCreateUser: true },
    })
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-sand-300/70 bg-sand-50 p-6 shadow-card sm:p-8">
      <h1 className="font-serif text-3xl font-semibold">Editor sign in</h1>
      {sent ? (
        <p className="mt-3 text-charcoal-500">Check your inbox for a sign-in link. You can close this tab.</p>
      ) : (
        <form onSubmit={send} className="mt-5 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-sand-300 bg-white px-4 py-3 outline-none focus:border-forest"
          />
          <Button className="w-full" type="submit">Send me a sign-in link</Button>
          {error && <p className="text-sm text-terra">{error}</p>}
        </form>
      )}
    </div>
  )
}

function Queue() {
  const [pending, setPending] = useState<QueueStory[]>([])
  const [recent, setRecent] = useState<QueueStory[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [p, r] = await Promise.all([
      supabase.from('stories').select(SELECT).eq('status', 'pending_review').order('last_article_at', { ascending: false }),
      supabase.from('stories').select(SELECT).eq('status', 'published').order('published_at', { ascending: false }).limit(15),
    ])
    setPending((p.data as unknown as QueueStory[]) ?? [])
    setRecent((r.data as unknown as QueueStory[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const update = async (id: string, patch: Record<string, unknown>) => {
    const { error } = await supabase.from('stories').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) alert(error.message)
    await load()
    loadLive()
  }

  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-serif text-3xl font-semibold">Waiting for review</h1>
        <p className="mt-1 text-charcoal-500">Top-importance stories are published only after you approve them.</p>
        <div className="mt-5 space-y-4">
          {loading ? (
            <p className="text-charcoal-400">Loading…</p>
          ) : pending.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-sand-300 p-6 text-center text-charcoal-500">All clear. Nothing waiting.</p>
          ) : (
            pending.map((s) => (
              <ReviewCard
                key={s.id}
                story={s}
                onApprove={(title) => update(s.id, { status: 'published', title, published_at: new Date().toISOString() })}
                onReject={() => update(s.id, { status: 'rejected' })}
              />
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-2xl font-semibold">Recently published</h2>
        <p className="mt-1 text-charcoal-500">Mark a story Debunked when it turns out wrong. It stays up, crossed out, with your note.</p>
        <ul className="mt-4 divide-y divide-sand-300/70 rounded-2xl border border-sand-300/70 bg-sand-50">
          {recent.map((s) => (
            <RecentRow key={s.id} story={s} onUpdate={(patch) => update(s.id, patch)} />
          ))}
        </ul>
      </section>
    </div>
  )
}

function RecentRow({ story: s, onUpdate }: { story: QueueStory; onUpdate: (patch: Record<string, unknown>) => void }) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState(s.debunk_note ?? '')
  const hint = officialDiffers(s)
  return (
    <li className="p-3 sm:p-4">
      <div className="flex items-center gap-3">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2 text-xs text-charcoal-400">
            <TopicPill topic={s.topic} /> <LabelTag label={s.label} /> · score {s.importance} · {s.article_count} articles
            {s.debunked && <span className="rounded bg-ink px-1.5 py-0.5 font-semibold text-paper">Debunked</span>}
            {!s.debunked && hint && <span className="rounded border border-ink px-1.5 py-0.5 font-semibold text-ink">Suggested: {hint.source} differs</span>}
          </span>
          <span className={`mt-1 block truncate font-medium ${s.debunked ? 'line-through' : ''}`}>{s.title}</span>
        </span>
        <button
          onClick={() => (s.debunked ? onUpdate({ debunked: false, debunk_note: null }) : setOpen(!open))}
          aria-expanded={s.debunked ? undefined : open}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-sand-300 px-3 py-1.5 text-xs text-charcoal-500 hover:text-charcoal"
        >
          <Ban className="h-3.5 w-3.5" /> {s.debunked ? 'Undo debunk' : 'Debunk'}
        </button>
        <button
          onClick={() => onUpdate({ status: 'rejected' })}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-sand-300 px-3 py-1.5 text-xs text-charcoal-500 hover:text-charcoal"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Unpublish
        </button>
      </div>
      {hint && !s.debunked && <p className="mt-1 text-xs text-charcoal-500">{hint.source}: {hint.note}</p>}
      {open && !s.debunked && (
        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault()
            if (note.trim()) onUpdate({ debunked: true, debunk_note: note.trim() })
          }}
        >
          <label className="sr-only" htmlFor={`note-${s.id}`}>What really happened</label>
          <input
            id={`note-${s.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What really happened, in one sentence"
            maxLength={200}
            className="min-w-0 flex-1 rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm outline-none focus:border-forest"
            autoFocus
          />
          <Button type="submit" disabled={!note.trim()}>Mark debunked</Button>
        </form>
      )}
    </li>
  )
}

function ReviewCard({ story, onApprove, onReject }: { story: QueueStory; onApprove: (title: string) => void; onReject: () => void }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(story.title)

  return (
    <article className="rounded-2xl border border-sand-300/70 bg-sand-50 p-5 shadow-card">
      <div className="flex flex-wrap items-center gap-2 text-xs text-charcoal-400">
        <TopicPill topic={story.topic} /> <LabelTag label={story.label} /> · score {story.importance} · {story.article_count} articles
      </div>
      {editing ? (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-2 w-full rounded-xl border border-sand-300 bg-white px-3 py-2 font-serif text-xl font-semibold outline-none focus:border-forest"
          autoFocus
        />
      ) : (
        <h3 className="mt-2 font-serif text-xl font-semibold leading-snug">{title}</h3>
      )}
      <p className="mt-1 text-charcoal-500">{story.dek}</p>
      {story.takeaways?.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {story.takeaways.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-sm"><b>Why it matters:</b> {story.why_it_matters}</p>
      <details className="mt-3 text-sm text-charcoal-500">
        <summary className="cursor-pointer">Sources ({story.articles.length})</summary>
        <ul className="mt-2 space-y-1">
          {story.articles.map((a) => (
            <li key={a.url}>
              <a href={a.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1 hover:text-charcoal">
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span><b>{a.sources?.name}</b> ({a.sources?.tier}): {a.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </details>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => onApprove(title.trim() || story.title)}>
          <Check className="h-4 w-4" /> Approve
        </Button>
        <Button variant="secondary" onClick={() => setEditing(!editing)}>
          <Pencil className="h-4 w-4" /> {editing ? 'Done editing' : 'Edit title'}
        </Button>
        <Button variant="secondary" onClick={onReject}>
          <X className="h-4 w-4" /> Reject
        </Button>
      </div>
    </article>
  )
}
