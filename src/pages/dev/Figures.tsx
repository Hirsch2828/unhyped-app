import ExplodedFigure from '../../components/anatomy/ExplodedFigure'
import { eventScene, type EventKind } from '../../components/anatomy/objects/events'
import { objectFor } from '../../components/anatomy/objects'

// Dev-only sheet of every event scene at a fixed explode amount, for screenshots.
const KINDS: EventKind[] = ['earnings', 'regulation', 'launch', 'probe', 'leadership', 'deal']
export default function Figures() {
  const t = Number(new URLSearchParams(location.hash.split('?')[1]).get('t') ?? '1')
  return (
    <div className="anatomy grid grid-cols-2 gap-4 bg-paper p-4">
      {(['phone'] as const).flatMap((f) => [0, 0.5, 1].map((x) => (
        <figure key={f + x} className="border border-rule">
          <ExplodedFigure obj={objectFor(f)!} label={f} still={x} />
          <figcaption className="t-meta p-2">{f} t={x}</figcaption>
        </figure>
      )))}
      {KINDS.map((k) => (
        <figure key={k} className="border border-rule">
          <ExplodedFigure obj={eventScene(k)} label={k} still={t} />
          <figcaption className="t-meta p-2">{k}</figcaption>
        </figure>
      ))}
    </div>
  )
}
