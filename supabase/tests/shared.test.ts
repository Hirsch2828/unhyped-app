// Run: node --experimental-strip-types supabase/tests/shared.test.ts
import assert from 'node:assert/strict'
import { normalizeUrl, parseFeed } from '../functions/_shared/rss.ts'
import { changeNote, clampImportance, labelFor, statusFor } from '../functions/_shared/rules.ts'

const rss = `<?xml version="1.0"?><rss><channel><title>X</title>
<item><title><![CDATA[OpenAI ships agents &amp; more]]></title><link>https://ex.com/a?utm_source=rss&id=2</link>
<description>&lt;p&gt;Long-running &lt;b&gt;agents&lt;/b&gt; are here.&lt;/p&gt;</description><pubDate>Mon, 09 Nov 2026 07:00:00 GMT</pubDate></item>
<item><title>No link</title></item>
</channel></rss>`
const r = parseFeed(rss)
assert.equal(r.length, 1)
assert.equal(r[0].title, 'OpenAI ships agents & more')
assert.equal(r[0].summary, 'Long-running agents are here.')
assert.equal(r[0].publishedAt, '2026-11-09T07:00:00.000Z')
assert.equal(normalizeUrl(r[0].url), 'https://ex.com/a?id=2')

const atom = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title type="html">Tesla Q3</title>
<link rel="alternate" href="https://ex.com/t"/><updated>2026-11-08T10:00:00Z</updated><summary>Deliveries rose.</summary></entry></feed>`
const a = parseFeed(atom)
assert.equal(a.length, 1)
assert.equal(a[0].url, 'https://ex.com/t')
assert.equal(a[0].summary, 'Deliveries rose.')

assert.equal(labelFor(['signal']), 'rumor')
assert.equal(labelFor(['signal', 'news']), 'report')
assert.equal(labelFor(['news', 'official', 'signal']), 'official')
assert.equal(changeNote('rumor', 'official'), 'Now confirmed by an official source.')
assert.equal(changeNote(null, 'official'), null)
assert.equal(clampImportance(3, 'rumor'), 1)
assert.equal(clampImportance('7', 'report'), 3)
assert.equal(clampImportance(undefined, 'report'), 2)
assert.equal(statusFor(['official']), 'published')
assert.equal(statusFor(['signal', 'news']), 'published')
assert.equal(statusFor(['signal', 'signal']), 'draft')
assert.equal(statusFor([]), 'draft')
const social = parseFeed('<rss><channel><item><link>https://bsky.app/profile/x/post/1</link><description>NEW: Anthropic files for IPO</description><pubDate>19 Nov 2026 14:31 +0000</pubDate></item></channel></rss>')
assert.equal(social[0].title, 'NEW: Anthropic files for IPO')
console.log('all shared tests passed')

// Writing rules
import { copyProblems, isTitleCase } from '../functions/_shared/rules.ts'
const good = { title: 'Tesla begins rolling out software update 2026.44.1', dek: 'The update adds new charging details.', why_it_matters: 'Owners get the new charging map this week.', claims: [{ article_ids: ['x'] }] }
assert.deepEqual(copyProblems(good, 'tesla'), [])
assert.equal(isTitleCase('Microsoft and Salesforce Announce Copilotforce Integration'), true)
assert.equal(isTitleCase('Nvidia reports Q3 results amid leadership uncertainty'), false)
assert.equal(isTitleCase('Jensen Huang states he is willing to return as Nvidia CEO'), false)
const bad = copyProblems({ ...good, title: 'Tesla Stock Will Rise After This Revolutionary Update!', claims: [] }, 'tesla')
assert.ok(bad.some((p) => p.includes('Title Case')))
assert.ok(bad.some((p) => p.includes('revolutionary')))
assert.ok(bad.some((p) => p.includes('exclamation')))
assert.ok(bad.some((p) => p.includes('cites')))
assert.ok(bad.some((p) => p.includes('advice')))
assert.ok(copyProblems({ ...good, why_it_matters: 'This development highlights the growing importance of AI.' }, 'ai').some((p) => p.includes('generic')))
assert.ok(copyProblems({ ...good, why_it_matters: 'One. Two. Three.' }, 'ai').some((p) => p.includes('more than 2')))
assert.ok(copyProblems({ ...good, title: 'x'.repeat(90) }, 'ai').some((p) => p.includes('characters')))
console.log('writing rules: ok')
