import { Link } from 'react-router-dom'
import {
  ArrowRight, BarChart3, BatteryCharging, Bookmark, BookmarkCheck, Bot, Car, Check as CheckIcon, Circle, Clock, Cpu, Database,
  Factory, FileText, FlaskConical, HelpCircle, Landmark, List, Navigation, ShieldCheck, Sparkles, Sun, TrendingUp, Wind, Wrench, Zap,
  type LucideProps,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  BarChart3, BatteryCharging, Bot, Car, Cpu, Database, Factory, FileText, FlaskConical, Landmark, List, Navigation, Sparkles, Sun,
  TrendingUp, Wind, Wrench, Zap,
}
import type { Label, Story, Topic } from '../data/types'
import { topicInfo } from '../data/topics'
import { timeAgo } from '../lib/feed'
import { usePrefs } from '../lib/prefs'

export function Icon({ name, ...rest }: { name: string } & LucideProps) {
  const C = iconMap[name] ?? Circle
  return <C {...rest} />
}

const labelInfo: Record<Label, { text: string; conf: string; hint: string; icon: typeof ShieldCheck; cls: string }> = {
  official: { text: 'Official', conf: 'High confidence', hint: 'Confirmed by the company, a regulator, or a published paper.', icon: ShieldCheck, cls: 'text-forest' },
  report: { text: 'Report', conf: 'Likely', hint: 'Reported by credible outlets. Not yet confirmed.', icon: FileText, cls: 'text-terra-600' },
  rumor: { text: 'Rumor', conf: 'Unconfirmed', hint: 'Unverified. Shown so you know not to take it as fact.', icon: HelpCircle, cls: 'text-honey' },
}
export const labelHint = (l: Label) => labelInfo[l].hint

export function LabelTag({ label, light = false }: { label: Label; light?: boolean }) {
  const L = labelInfo[label]
  const I = L.icon
  return (
    <span className={`inline-flex items-center gap-1 ${light ? 'text-sand-50' : L.cls}`} title={L.hint}>
      <I className="h-3.5 w-3.5" strokeWidth={2} />
      {L.text}
    </span>
  )
}

export function MetaRow({ story, light = false }: { story: Story; light?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${light ? 'text-sand-200' : 'text-charcoal-400'}`}>
      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{timeAgo(story.hoursAgo)}</span>
      <span aria-hidden>·</span>
      <LabelTag label={story.label} light={light} />
      <span aria-hidden>·</span>
      <span>{story.mergedCount} sources → 1 story</span>
    </div>
  )
}

const topicTone: Record<Topic, string> = {
  ai: 'bg-sage-100 text-forest',
  tesla: 'bg-terra-100 text-terra-600',
  robotics: 'bg-sage-100 text-forest',
  chips: 'bg-sand-200 text-charcoal-500',
  energy: 'bg-sage-100 text-forest',
  markets: 'bg-honey-100 text-honey',
}

export function TopicPill({ topic }: { topic: Topic }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${topicTone[topic]}`}>
      {topicInfo[topic].name}
    </span>
  )
}

export function Img({ src, className = '', alt = '' }: { src: string; className?: string; alt?: string }) {
  return <img src={src} alt={alt} loading="lazy" className={`object-cover ${className}`} />
}

export function SaveButton({ story, onSaved, className = '' }: { story: Story; onSaved?: () => void; className?: string }) {
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
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition hover:bg-sand-200 ${saved ? 'text-terra' : 'text-charcoal-500'} ${className}`}
    >
      {saved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
    </button>
  )
}

export function StoryCard({ story }: { story: Story }) {
  return (
    <Link
      to={`/story/${story.id}`}
      className="group flex w-[78vw] max-w-[320px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-sand-300/70 bg-sand-50 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-forest sm:w-[300px]"
    >
      <div className="overflow-hidden">
        <Img src={story.image} className="h-36 w-full transition duration-500 group-hover:scale-[1.04]" />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-[1.05rem] font-semibold leading-snug text-charcoal">{story.title}</h3>
          <SaveButton story={story} className="-mr-2 -mt-1" />
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-charcoal-500">{story.dek}</p>
        <div className="mt-auto pt-3">
          <MetaRow story={story} />
        </div>
      </div>
    </Link>
  )
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4 px-4 sm:px-8">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h2 className="font-serif text-2xl text-charcoal">{title}</h2>
        {subtitle && <span className="text-sm text-charcoal-400">{subtitle}</span>}
      </div>
      {action}
    </div>
  )
}

export function Row({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="fade-in">
      <SectionHeader title={title} subtitle={subtitle} />
      <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 pt-1 sm:scroll-px-8 sm:px-8">
        {children}
      </div>
    </section>
  )
}

export function Logo({ className = '' }: { className?: string }) {
  return <span className={`font-serif text-[1.65rem] font-semibold tracking-tight text-charcoal ${className}`}>Unhyped</span>
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'terra' }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[0.95rem] font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 disabled:opacity-40'
  const v = {
    primary: 'bg-forest text-sand-50 hover:bg-forest-600',
    secondary: 'border border-sand-300 bg-sand-50 text-charcoal hover:bg-sand-200',
    terra: 'bg-terra text-white hover:bg-terra-600 rounded-full',
  }[variant]
  return (
    <button className={`${base} ${v} ${className}`} {...rest}>
      {children}
    </button>
  )
}

export function Check({ on, dark = false }: { on: boolean; dark?: boolean }) {
  return on ? (
    <span className="grid h-6 w-6 place-items-center rounded-full bg-forest text-sand-50 ring-2 ring-sand-50/70">
      <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />
    </span>
  ) : (
    <span className={`h-6 w-6 rounded-full border-2 ${dark ? 'border-white/90' : 'border-sand-300 bg-sand-50'}`} />
  )
}

export function ArrowCircle({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border transition ${dark ? 'border-white/40 bg-white/10 text-white' : 'border-sand-300 text-charcoal group-hover:bg-sand-200'}`}
    >
      <ArrowRight className="h-5 w-5" />
    </span>
  )
}
