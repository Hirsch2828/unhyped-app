import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BarChart3, BatteryCharging, Bookmark, BrainCircuit, BookmarkCheck, Bot, Car, Check as CheckIcon, Circle, Cpu, Database,
  Factory, FileText, FlaskConical, Landmark, List, Navigation, Sparkles, Sun, TrendingUp, Wind, Wrench, Zap,
  type LucideProps,
} from 'lucide-react'
import type { Label, Story, Topic } from '../data/types'
import { areas, topicInfo } from '../data/topics'
import { timeAgo } from '../lib/feed'
import { usePrefs } from '../lib/prefs'

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  BrainCircuit, BarChart3, BatteryCharging, Bot, Car, Cpu, Database, Factory, FileText, FlaskConical, Landmark, List, Navigation, Sparkles, Sun,
  TrendingUp, Wind, Wrench, Zap,
}

export function Icon({ name, ...rest }: { name: string } & LucideProps) {
  const C = iconMap[name] ?? Circle
  return <C {...rest} />
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/* ---------- Trust labels ---------- */

const labelInfo: Record<Label, { text: string; hint: string }> = {
  official: { text: 'Official', hint: 'Confirmed by the company, a regulator, or a published paper.' },
  report: { text: 'Report', hint: 'Reported by credible outlets. Not yet confirmed.' },
  rumor: { text: 'Rumor', hint: 'Unverified. Shown so you know not to take it as fact.' },
}
export const labelHint = (l: Label) => labelInfo[l].hint

// Shape carries the meaning, so colour is never the only cue:
// Official = filled ink tag, Report = outlined tag, Rumor = dashed outline.
function Tag({ label, light }: { label: Label; light?: boolean }) {
  const ink = light ? 'border-paper text-paper' : 'border-ink text-ink'
  const cls = {
    official: light ? 'border border-paper bg-paper text-ink' : 'border border-ink bg-ink text-paper',
    report: `border ${ink}`,
    rumor: `border border-dashed ${ink}`,
  }[label]
  return <span className={`t-eyebrow inline-flex h-[18px] items-center px-1.5 leading-none ${cls}`}>{labelInfo[label].text}</span>
}

// Trust label shown the same way everywhere. With `explain`, a tap opens the plain-language meaning.
export function TrustMark({ label, light = false, explain = false }: { label: Label; light?: boolean; explain?: boolean }) {
  const L = labelInfo[label]
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: Event) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])
  if (!explain)
    return (
      <span className="inline-flex" title={L.hint}>
        <Tag label={label} light={light} />
      </span>
    )
  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        aria-expanded={open}
        aria-label={`${L.text}: what does this mean?`}
        className="relative inline-flex items-center gap-1 before:absolute before:-inset-[14px] before:content-['']"
      >
        <Tag label={label} light={light} />
        <span aria-hidden className="t-meta text-ink-soft">?</span>
      </button>
      {open && (
        <span role="tooltip" className="fade-in absolute left-0 top-full z-40 mt-2 w-64 border border-ink bg-paper px-3.5 py-3 text-[13px] font-normal normal-case leading-5 tracking-normal text-ink">
          <span className="mb-1.5 block"><Tag label={label} /></span>
          {L.hint}
        </span>
      )}
    </span>
  )
}

/** Back-compat name used by the editor. */
export function LabelTag({ label, light = false }: { label: Label; light?: boolean }) {
  return <TrustMark label={label} light={light} />
}

/** time · trust mark, in meta style */
export function MetaRow({ story, light = false, explain = false }: { story: Story; light?: boolean; explain?: boolean }) {
  return (
    <div className={`t-meta flex flex-wrap items-center gap-x-2 gap-y-1 ${light ? 'text-paper/85' : 'text-ink-soft'}`}>
      <TrustMark label={story.label} light={light} explain={explain} />
      <span>{timeAgo(story.hoursAgo)}</span>
      <span aria-hidden>·</span>
      <span>{plural(story.sources.length || story.mergedCount, 'source')}</span>
    </div>
  )
}

/* ---------- Categories ---------- */

const topicIcon: Record<Topic, string> = {
  ai: 'BrainCircuit', tesla: 'Car', robotics: 'Bot', chips: 'Cpu', energy: 'Zap', markets: 'TrendingUp',
}
export function categoryOf(id: string): { name: string; icon: string } | null {
  if (id in topicInfo) return { name: topicInfo[id as Topic].name, icon: topicIcon[id as Topic] }
  for (const list of Object.values(areas)) {
    const a = list.find((x) => x.id === id)
    if (a) return { name: a.name, icon: a.icon }
  }
  return null
}
export function categoryName(story: Pick<Story, 'topic' | 'area'>) {
  const c = categoryOf(story.area) ?? categoryOf(story.topic)!
  return story.topic === 'tesla' && story.area ? `Tesla · ${c.name}` : c.name
}

// Desk line in mono: "AI · POLICY", "TESLA · FSD & AUTONOMY". No icons in the new style.
export function CategoryBadge({ story, className = '', light = false }: { story: Pick<Story, 'topic' | 'area'>; className?: string; light?: boolean }) {
  const c = categoryOf(story.area)
  const desk = c && story.area ? `${topicInfo[story.topic].name} · ${c.name}` : topicInfo[story.topic].name
  return <span className={`t-eyebrow inline-block ${light ? 'text-paper/85' : 'text-ink-soft'} ${className}`}>{desk}</span>
}

export function TopicPill({ topic }: { topic: Topic }) {
  return <span className="t-eyebrow text-ink-soft">{topicInfo[topic].name}</span>
}

/* ---------- Plates (no photography) ---------- */

export function Img({ src, className = '', alt = '' }: { src: string; className?: string; alt?: string }) {
  return <img src={src} alt={alt} loading="lazy" decoding="async" className={`bg-paper-2 object-cover ${className}`} />
}

// Kept so pages that wrap content in an image scope still work. Plates are unique per story, so nothing is deduped.
export function ImageScope({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

const areaGlyph: Record<string, string> = {
  policy: '§', business: '$', models: '∆', agents: '⇄', tools: '⌘', research: '∴', infrastructure: '▦',
  vehicles: '▭', fsd: '◎', optimus: '⊕', 'tesla-energy': 'ϟ', earnings: '±', markets: '±',
}

// One glyph taken from the story itself: a number from the headline when there is one,
// "?" for an unconfirmed claim, otherwise the sign of its desk.
export function glyphFor(story: Pick<Story, 'title' | 'label' | 'area' | 'topic'>) {
  if (story.label === 'rumor') return '?'
  const money = story.title.match(/\$\s?(\d+(?:[.,]\d+)?)\s?(trillion|billion|million|tn|bn|[TBM])\b/i)
  if (money) {
    const unit = money[2].toLowerCase()
    return `$${money[1]}${unit.startsWith('t') ? 'T' : unit.startsWith('b') ? 'B' : 'M'}`
  }
  const pct = story.title.match(/[-−+]?\d+(?:\.\d+)?%/)
  if (pct) return pct[0].replace('-', '−')
  const ver = story.title.match(/\b\d+\.\d+\b/)
  if (ver) return ver[0]
  return areaGlyph[story.area] ?? (story.topic === 'tesla' ? 'T' : '◇')
}

// Generated plate: a halftone field and one glyph from the story's own world. Never decorative, never missing.
export function Plate({ story, size = 'md', className = '' }: { story: Pick<Story, 'title' | 'label' | 'area' | 'topic'>; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const g = glyphFor(story)
  const long = g.length > 3
  const fs = size === 'sm' ? (long ? 18 : 30) : size === 'lg' ? (long ? 76 : 120) : long ? 52 : 84
  return (
    <div aria-hidden className={`relative overflow-hidden border border-ink bg-paper ${className}`}>
      <div className="halftone absolute inset-0 opacity-[0.16] [mask-image:linear-gradient(115deg,transparent_25%,#000_95%)]" />
      <span
        className="absolute bottom-[6%] right-[7%] font-bold leading-none tracking-[-0.06em] text-ink"
        style={{ fontSize: fs }}
      >
        {g}
      </span>
      {size !== 'sm' && <span className="t-eyebrow absolute left-3 top-2.5 text-ink-soft">{topicInfo[story.topic].name}</span>}
    </div>
  )
}

// Old name, now always a plate (kept so every page keeps working).
export function StoryImg({
  story,
  className = '',
  mini = false,
  size,
}: {
  story: Pick<Story, 'id' | 'image' | 'illustration' | 'title' | 'topic' | 'area' | 'ownImage' | 'label'>
  className?: string
  imgClassName?: string
  mini?: boolean
  size?: 'sm' | 'md' | 'lg'
  badgeTop?: boolean
}) {
  return <Plate story={story} size={size ?? (mini ? 'sm' : 'md')} className={className} />
}

// Headline with the one phrase that carries the news under the lime highlighter.
export function Headline({ story, className = '' }: { story: Pick<Story, 'title' | 'highlight'>; className?: string }) {
  const hl = story.highlight
  const i = hl ? story.title.indexOf(hl) : -1
  if (!hl || i < 0) return <span className={className}>{story.title}</span>
  return (
    <span className={className}>
      {story.title.slice(0, i)}
      <span className="mark">{hl}</span>
      {story.title.slice(i + hl.length)}
    </span>
  )
}

/* ---------- Actions ---------- */

export function SaveButton({ story, onSaved, className = '', light = false }: { story: Story; onSaved?: () => void; className?: string; light?: boolean }) {
  const { prefs, toggleSave } = usePrefs()
  const saved = prefs.saved.includes(story.id)
  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (toggleSave(story.id)) onSaved?.()
      }}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from saved' : 'Save story'}
      className={`press grid h-11 w-11 shrink-0 place-items-center ${saved ? 'text-ink' : light ? 'text-paper' : 'text-ink-soft hover:text-ink'} ${className}`}
    >
      {saved ? <BookmarkCheck className="h-[18px] w-[18px]" fill="currentColor" strokeWidth={1.75} /> : <Bookmark className="h-[18px] w-[18px]" strokeWidth={1.75} />}
    </button>
  )
}

/* ---------- Story layouts ---------- */

// Card for horizontal rows: plate, desk, headline, meta. Read stories fade.
export function StoryCard({ story, wide = false }: { story: Story; wide?: boolean }) {
  const { prefs } = usePrefs()
  const read = prefs.read.includes(story.id)
  return (
    <Link
      to={`/story/${story.id}`}
      className={`press group flex shrink-0 snap-start flex-col ${wide ? 'w-full' : 'w-[70vw] max-w-[280px] sm:w-[280px]'} ${read ? 'opacity-55' : ''}`}
    >
      <Plate story={story} className="aspect-[4/3] w-full" />
      <CategoryBadge story={story} className="mt-3" />
      <h3 className="t-card mt-1 text-ink group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
        <Headline story={story} />
      </h3>
      <div className="mt-2 flex items-center justify-between">
        <MetaRow story={story} />
        <SaveButton story={story} className="-my-3 -mr-3" />
      </div>
    </Link>
  )
}

// Compact text row with a hairline above. `lead` is an optional left column (a numeral or a time).
export function CompactRow({ story, lead, thumb = false }: { story: Story; lead?: React.ReactNode; thumb?: boolean }) {
  const { prefs } = usePrefs()
  const read = prefs.read.includes(story.id)
  return (
    <Link to={`/story/${story.id}`} className={`press group flex gap-4 border-t border-rule py-4 ${read ? 'opacity-55' : ''}`}>
      {lead}
      <span className="min-w-0 flex-1">
        <CategoryBadge story={story} />
        <span className="t-card mt-1 block text-[17px] leading-[21px] text-ink group-hover:underline group-hover:underline-offset-4">
          <Headline story={story} />
        </span>
        <span className="mt-2 block">
          <MetaRow story={story} />
        </span>
      </span>
      {thumb && <Plate story={story} size="sm" className="mt-1 h-[64px] w-[64px] shrink-0" />}
    </Link>
  )
}

export function SectionHeader({ title, meta, seeAll }: { title: string; meta?: string; seeAll?: string; subtitle?: string }) {
  return (
    <div className="mb-3 px-6 sm:px-8">
      <div className="rule-strong flex items-baseline justify-between gap-4 pt-2.5">
        <h2 className="t-eyebrow text-ink">{title}</h2>
        {seeAll && (
          <Link to={seeAll} className="t-eyebrow -my-3 inline-flex min-h-[44px] shrink-0 items-center gap-1 text-ink-soft hover:text-ink">
            See all <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      {meta && <p className="t-meta mt-1 text-ink-soft">{meta}</p>}
    </div>
  )
}

export function Row({
  title,
  subtitle,
  seeAll,
  children,
}: {
  title: string
  subtitle?: string
  seeAll?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <SectionHeader title={title} meta={subtitle} seeAll={seeAll} />
      <div className="no-scrollbar flex snap-x snap-mandatory items-start gap-5 overflow-x-auto scroll-px-6 px-6 pb-1 sm:scroll-px-8 sm:px-8">
        {children}
      </div>
    </section>
  )
}

/* ---------- Basics ---------- */

// Word mark with a lime full stop.
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline text-[24px] font-bold leading-none tracking-[-0.05em] text-ink ${className}`}>
      Unhyped
      <span aria-hidden className="ml-[2px] inline-block h-[7px] w-[7px] bg-lime ring-1 ring-ink/80" />
    </span>
  )
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'terra' }) {
  const base =
    'press inline-flex min-h-[48px] items-center justify-center gap-2 px-6 py-3 text-[15px] font-semibold tracking-[-0.01em] disabled:opacity-40'
  const v = {
    primary: 'bg-ink text-paper hover:bg-ink/85',
    secondary: 'border border-ink bg-transparent text-ink hover:bg-paper-2',
    terra: 'bg-lime text-lime-ink hover:brightness-95',
  }[variant]
  return (
    <button className={`${base} ${v} ${className}`} {...rest}>
      {children}
    </button>
  )
}

// One check style everywhere: a filled ink square with a check when on, an outlined square when off.
export function Check({ on, dark = false }: { on: boolean; dark?: boolean }) {
  return on ? (
    <span className="grid h-6 w-6 shrink-0 place-items-center bg-ink text-paper">
      <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />
    </span>
  ) : (
    <span className={`block h-6 w-6 shrink-0 border-[1.5px] ${dark ? 'border-paper/90' : 'border-ink/40'}`} />
  )
}

export function ArrowCircle({ dark = false }: { dark?: boolean }) {
  return (
    <span className={`grid h-11 w-11 shrink-0 place-items-center border ${dark ? 'border-paper/50 text-paper' : 'border-ink text-ink group-hover:bg-paper-2'}`}>
      <ArrowRight className="h-5 w-5" />
    </span>
  )
}
