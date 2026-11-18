// Editor tab: check each company's teardown facts against its official source, edit them, and approve.
// Only approved companies are read by the site; drafts stay on the built-in text until then.
import { useCallback, useEffect, useState } from 'react'
import { Check, ExternalLink, RotateCcw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui'

interface PartRow { company_id: string; id: string; position: number; name: string; role: string; what: string }
interface CompanyRow {
  id: string
  name: string
  line: string
  form: string
  source_label: string
  source_url: string
  status: 'draft' | 'approved'
  approved_at: string | null
  company_parts: PartRow[]
}

export default function CompaniesReview() {
  const [rows, setRows] = useState<CompanyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('id,name,line,form,source_label,source_url,status,approved_at,company_parts(company_id,id,position,name,role,what)')
      .order('name')
    if (error) setError(error.message)
    setRows(((data ?? []) as CompanyRow[]).map((c) => ({ ...c, company_parts: [...c.company_parts].sort((a, b) => a.position - b.position) })))
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  if (loading) return <p className="text-charcoal-500">Loading…</p>
  const drafts = rows.filter((r) => r.status === 'draft').length
  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">Company facts</h1>
      <p className="mt-2 text-charcoal-500">
        {drafts ? `${drafts} of ${rows.length} waiting for a check.` : 'All companies are approved.'} Open the source, check each line, fix what is off, then approve.
      </p>
      {error && <p className="mt-3 text-sm text-terra">{error}</p>}
      <div className="mt-6 space-y-5">
        {rows.map((c) => <CompanyCard key={c.id} company={c} onChange={load} />)}
      </div>
    </div>
  )
}

function CompanyCard({ company, onChange }: { company: CompanyRow; onChange: () => void }) {
  const [line, setLine] = useState(company.line)
  const [parts, setParts] = useState(company.company_parts)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dirty = line !== company.line || parts.some((p, i) => p.role !== company.company_parts[i].role || p.what !== company.company_parts[i].what)

  const save = async (status?: 'draft' | 'approved') => {
    setBusy(true)
    setError(null)
    const now = new Date().toISOString()
    const head = await supabase.from('companies').update({
      line,
      updated_at: now,
      ...(status ? { status, approved_at: status === 'approved' ? now : null } : {}),
    }).eq('id', company.id)
    let err = head.error
    for (const [i, p] of parts.entries()) {
      const o = company.company_parts[i]
      if (err || (p.role === o.role && p.what === o.what)) continue
      err = (await supabase.from('company_parts').update({ role: p.role, what: p.what }).eq('company_id', company.id).eq('id', p.id)).error
    }
    setBusy(false)
    if (err) return setError(err.message)
    onChange()
  }

  const set = (i: number, key: 'role' | 'what', v: string) => setParts((ps) => ps.map((p, j) => (j === i ? { ...p, [key]: v } : p)))
  const approved = company.status === 'approved'
  return (
    <article className="rounded-2xl border border-sand-300/70 bg-sand-50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-serif text-2xl font-semibold">{company.name}</h2>
          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${approved ? 'bg-forest text-sand-50' : 'bg-sand-200 text-charcoal'}`}>
            {approved ? 'Approved' : 'Draft'}
          </span>
        </div>
        <a href={company.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-charcoal-500 underline hover:text-charcoal">
          {company.source_label} <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-charcoal-500">What it sells</label>
      <textarea value={line} onChange={(e) => setLine(e.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-[15px]" />
      <ol className="mt-4 space-y-4">
        {parts.map((p, i) => (
          <li key={p.id} className="border-t border-sand-300/70 pt-3">
            <p className="font-semibold">{String(i + 1).padStart(2, '0')} · {p.name}</p>
            <label className="mt-2 block text-xs text-charcoal-500">In the drawing (the metaphor)</label>
            <textarea value={p.role} onChange={(e) => set(i, 'role', e.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-[15px]" />
            <label className="mt-2 block text-xs text-charcoal-500">The fact, from the source</label>
            <textarea value={p.what} onChange={(e) => set(i, 'what', e.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-[15px]" />
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {approved ? (
          <>
            {dirty && <Button onClick={() => save()} disabled={busy}><Check className="h-4 w-4" /> Save changes</Button>}
            <button onClick={() => save('draft')} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-charcoal-500 hover:text-charcoal">
              <RotateCcw className="h-4 w-4" /> Back to draft
            </button>
          </>
        ) : (
          <Button onClick={() => save('approved')} disabled={busy}><Check className="h-4 w-4" /> {dirty ? 'Save and approve' : 'Approve'}</Button>
        )}
        {error && <span className="text-sm text-terra">{error}</span>}
      </div>
    </article>
  )
}
