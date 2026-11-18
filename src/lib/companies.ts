// Company facts approved in the editor replace the drafted text in src/data/companies.ts.
// Companies not approved yet keep their drafted text (each line points at its official source).
import { COMPANIES } from '../data/companies'
import { supabase } from './supabase'
import { refresh } from './stories'

interface Row {
  id: string
  line: string
  company_parts: { id: string; name: string; role: string; what: string }[]
}

export async function loadCompanyFacts() {
  const { data, error } = await supabase.from('companies').select('id,line,company_parts(id,name,role,what)').eq('status', 'approved')
  if (error || !data?.length) return
  for (const row of data as Row[]) {
    const c = COMPANIES.find((x) => x.id === row.id)
    if (!c) continue
    c.line = row.line
    c.status = 'approved'
    for (const p of row.company_parts) {
      const part = c.parts.find((x) => x.id === p.id)
      if (part) Object.assign(part, { name: p.name, role: p.role, what: p.what })
    }
  }
  // Pages read COMPANIES directly, so let them draw again.
  refresh()
}
