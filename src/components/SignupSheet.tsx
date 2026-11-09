import { useState } from 'react'
import { BookmarkCheck } from 'lucide-react'
import { usePrefs } from '../lib/prefs'
import { Button } from './ui'

const times = ['07:00', '08:00', '12:30', '18:00', '21:00']

export default function SignupSheet({ onClose }: { onClose: () => void }) {
  const { update } = usePrefs()
  const [email, setEmail] = useState('')
  const [time, setTime] = useState('08:00')
  const valid = /\S+@\S+\.\S+/.test(email)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/40 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Keep your saved stories"
        className="fade-in w-full max-w-md rounded-t-3xl bg-sand-50 p-6 pb-safe shadow-2xl sm:rounded-3xl sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-sand-300 sm:hidden" />
        <span className="grid h-12 w-12 place-items-center rounded-full bg-sage-100 text-forest">
          <BookmarkCheck className="h-6 w-6" />
        </span>
        <h2 className="mt-4 font-serif text-2xl font-semibold">Saved. Want to keep it?</h2>
        <p className="mt-2 text-sm text-charcoal-500">
          Add your email so your saves follow you, and pick a time for your daily brief. No password.
        </p>

        <label className="mt-5 block text-sm font-medium" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1.5 w-full rounded-xl border border-sand-300 bg-white px-4 py-3 placeholder:text-charcoal-400/70 focus:border-forest focus:outline-none"
        />

        <p className="mt-5 text-sm font-medium">Daily brief at</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {times.map((t) => (
            <button
              key={t}
              onClick={() => setTime(t)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition ${time === t ? 'border-forest bg-forest text-sand-50' : 'border-sand-300 hover:border-sage'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => { update({ signupDismissed: true }); onClose() }}>
            Not now
          </Button>
          <Button className="flex-1" disabled={!valid} onClick={() => { update({ email, briefTime: time }); onClose() }}>
            Keep my saves
          </Button>
        </div>
        <p className="mt-3 text-center text-xs text-charcoal-400">Demo only. Nothing is sent anywhere.</p>
      </div>
    </div>
  )
}
