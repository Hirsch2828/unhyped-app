import { createContext, useContext, useEffect, useRef, useState } from 'react'
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

// The mark itself: Official = solid forest dot, Report = hollow sage ring, Rumor = dashed honey ring.
function Mark({ label, light }: { label: Label; light?: boolean }) {
  const cls = {
    official: light ? 'bg-sand' : 'bg-forest',
    report: light ? 'border-[1.5px] border-sand/90' : 'border-[1.5px] border-sage',
    rumor: 'border-[1.5px] border-dashed border-honey',
  }[label]
  return <span aria-hidden className={`inline-block h-[10px] w-[10px] shrink-0 rounded-full ${cls}`} />
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
  const body = (
    <>
      <Mark label={label} light={light} />
      {L.text}
    </>
  )
  if (!explain)
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold ${light ? 'text-sand' : 'text-charcoal'}`} title={L.hint}>
        {body}
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
        className={`relative inline-flex items-center gap-1.5 font-semibold ${light ? 'text-sand' : 'text-charcoal'} underline decoration-dotted decoration-1 underline-offset-[3px] before:absolute before:-inset-3 before:content-['']`}
      >
        {body}
      </button>
      {open && (
        <span
          role="tooltip"
          className="fade-in absolute left-0 top-full z-40 mt-2 w-64 rounded-card bg-charcoal px-3.5 py-3 text-[13px] font-normal normal-case leading-5 tracking-normal text-sand shadow-soft"
        >
          <span className="mb-1 flex items-center gap-1.5 font-medium">
            <Mark label={label} light /> {L.text}
          </span>
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
    <div className={`t-meta flex flex-wrap items-center gap-x-2 gap-y-1 ${light ? 'text-sand/85' : 'text-charcoal-400'}`}>
      <span>{timeAgo(story.hoursAgo)}</span>
      <span aria-hidden>·</span>
      <TrustMark label={story.label} light={light} explain={explain} />
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

// Category eyebrow with its small monochrome glyph ("logo" of the area).
export function CategoryBadge({ story, className = '', light = false }: { story: Pick<Story, 'topic' | 'area'>; className?: string; light?: boolean }) {
  const c = categoryOf(story.area) ?? categoryOf(story.topic)!
  return (
    <span className={`t-eyebrow inline-flex items-center gap-1.5 ${light ? 'text-sand/90' : 'text-sage-ink'} ${className}`}>
      <Icon name={c.icon} className="h-3 w-3" strokeWidth={2.25} aria-hidden />
      {categoryName(story)}
    </span>
  )
}

export function TopicPill({ topic }: { topic: Topic }) {
  return <span className="t-eyebrow text-sage-ink">{topicInfo[topic].name}</span>
}

/* ---------- Imagery ---------- */

export function Img({ src, className = '', alt = '' }: { src: string; className?: string; alt?: string }) {
  return <img src={src} alt={alt} loading="lazy" decoding="async" className={`bg-sand-200 object-cover ${className}`} />
}

// One screen never shows the same picture twice: the first story to use an image keeps it,
// later ones (and stories with only a shared library image) get a typographic card.
const ScopeCtx = createContext<Map<string, string> | null>(null)
export function ImageScope({ children }: { children: React.ReactNode }) {
  return <ScopeCtx.Provider value={new Map()}>{children}</ScopeCtx.Provider>
}
export function useClaim(story: Pick<Story, 'id' | 'image' | 'ownImage'>) {
  const scope = useContext(ScopeCtx)
  if (story.ownImage === false) return false
  if (!scope) return true
  const owner = scope.get(story.image)
  if (!owner) {
    scope.set(story.image, story.id)
    return true
  }
  return owner === story.id
}

// Typographic stand-in: a quiet "section cover" with the category in large Playfair, a rule and the area glyph.
export function TypeCard({ story, size = 'md', className = '' }: { story: Pick<Story, 'topic' | 'area'>; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const c = categoryOf(story.area) ?? categoryOf(story.topic)!
  const tesla = story.topic === 'tesla'
  const small = size === 'sm'
  return (
    <div className={`relative overflow-hidden ${tesla ? 'bg-sand-200' : 'bg-olive-100'} ${className}`} aria-hidden>
      <Icon
        name={c.icon}
        className={`absolute text-olive-200 ${small ? '-bottom-2 -right-2 h-12 w-12' : '-bottom-6 -right-4 h-40 w-40'}`}
        strokeWidth={small ? 1.5 : 0.9}
      />
      <div className={`relative flex h-full flex-col justify-between ${small ? 'p-2.5' : 'p-5 sm:p-6'}`}>
        <span className="t-eyebrow text-sage-ink">{topicInfo[story.topic].name}</span>
        <span>
          <span className={`block h-px bg-forest/30 ${small ? 'mb-1.5 w-4' : 'mb-3 w-10'}`} />
          <span
            className={`block font-serif font-semibold italic text-forest ${small ? 'text-[13px] leading-4' : size === 'lg' ? 'text-[40px] leading-[44px]' : 'text-[30px] leading-[34px]'}`}
          >
            {c.name}
          </span>
        </span>
      </div>
    </div>
  )
}

// Story picture: fills its box (aspect or height from className), sand skeleton while loading,
// a faint warm grade so all pictures sit in one palette, typographic card when not unique.
export function StoryImg({
  story,
  className = '',
  imgClassName = '',
  mini = false,
  size,
}: {
  story: Pick<Story, 'id' | 'image' | 'illustration' | 'title' | 'topic' | 'area' | 'ownImage'>
  className?: string
  imgClassName?: string
  mini?: boolean
  size?: 'sm' | 'md' | 'lg'
  badgeTop?: boolean
}) {
  const ok = useClaim(story)
  if (!ok) return <TypeCard story={story} size={size ?? (mini ? 'sm' : 'md')} className={className} />
  return (
    <div className={`relative overflow-hidden bg-sand-200 ${className}`}>
      <Img src={story.image} className={`absolute inset-0 h-full w-full ${imgClassName}`} />
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-[#E9DCC0] opacity-[0.08] mix-blend-multiply" />
    </div>
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
      className={`press grid h-11 w-11 shrink-0 place-items-center rounded-full ${saved ? 'text-forest' : light ? 'text-sand' : 'text-charcoal-400 hover:text-charcoal'} ${className}`}
    >
      {saved ? <BookmarkCheck className="h-[18px] w-[18px]" fill="currentColor" strokeWidth={1.75} /> : <Bookmark className="h-[18px] w-[18px]" strokeWidth={1.75} />}
    </button>
  )
}

/* ---------- Story layouts ---------- */

// Card for horizontal rows and grids: picture, eyebrow, Playfair title, meta. No box around it.
export function StoryCard({ story, wide = false }: { story: Story; wide?: boolean }) {
  return (
    <Link
      to={`/story/${story.id}`}
      className={`press group flex shrink-0 snap-start flex-col ${wide ? 'w-full' : 'w-[70vw] max-w-[288px] sm:w-[288px]'}`}
    >
      <StoryImg story={story} className="aspect-[4/3] w-full rounded-media" imgClassName="transition duration-500 group-hover:scale-[1.03]" />
      <CategoryBadge story={story} className="mt-3" />
      <h3 className="t-card mt-1.5 text-charcoal group-hover:text-forest">{story.title}</h3>
      <div className="mt-2 flex items-center justify-between">
        <MetaRow story={story} />
        <SaveButton story={story} className="-my-3 -mr-3" />
      </div>
    </Link>
  )
}

// Compact text row with a hairline above. `lead` is an optional left column (a numeral or a time).
export function CompactRow({ story, lead, thumb = false }: { story: Story; lead?: React.ReactNode; thumb?: boolean }) {
  const own = useClaim(story)
  return (
    <Link to={`/story/${story.id}`} className="press group flex gap-4 border-t border-rule py-4">
      {lead}
      <span className="min-w-0 flex-1">
        <CategoryBadge story={story} />
        <span className="t-card mt-1 block text-[17px] leading-[22px] text-charcoal group-hover:text-forest">{story.title}</span>
        <span className="mt-2 block">
          <MetaRow story={story} />
        </span>
      </span>
      {thumb && own && <StoryImg story={story} mini className="mt-1 h-[76px] w-[76px] shrink-0 rounded-lg" />}
    </Link>
  )
}

export function SectionHeader({ title, meta, seeAll }: { title: string; meta?: string; seeAll?: string; subtitle?: string }) {
  return (
    <div className="mb-4 px-6 sm:px-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="t-h2 text-charcoal">{title}</h2>
        {seeAll && (
          <Link to={seeAll} className="t-meta -my-3 inline-flex shrink-0 items-center gap-1 py-3 text-charcoal-400 hover:text-forest">
            See all <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      {meta && <p className="t-meta mt-1 text-charcoal-400">{meta}</p>}
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

export function Logo({ className = '' }: { className?: string }) {
  return <span className={`font-serif text-[28px] font-semibold leading-none tracking-[-0.02em] text-charcoal ${className}`}>Unhyped</span>
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'terra' }) {
  const base =
    'press inline-flex min-h-[48px] items-center justify-center gap-2 rounded-card px-6 py-3 text-[15px] font-medium disabled:opacity-40'
  const v = {
    primary: 'bg-forest text-sand hover:bg-forest-600',
    secondary: 'border border-rule bg-transparent text-charcoal hover:bg-sand-200',
    terra: 'bg-terra text-white hover:bg-terra-600',
  }[variant]
  return (
    <button className={`${base} ${v} ${className}`} {...rest}>
      {children}
    </button>
  )
}

// One check style everywhere: forest disc with a check when on, a quiet ring when off.
export function Check({ on, dark = false }: { on: boolean; dark?: boolean }) {
  return on ? (
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-forest text-sand">
      <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />
    </span>
  ) : (
    <span className={`block h-6 w-6 shrink-0 rounded-full border-[1.5px] ${dark ? 'border-sand/90 bg-charcoal/20' : 'border-charcoal/25'}`} />
  )
}

export function ArrowCircle({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border ${dark ? 'border-sand/40 text-sand' : 'border-rule text-charcoal group-hover:bg-sand-200'}`}
    >
      <ArrowRight className="h-5 w-5" />
    </span>
  )
}
