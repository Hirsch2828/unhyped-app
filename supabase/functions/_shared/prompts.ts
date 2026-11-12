// The two prompts the product depends on. Keep the three hard rules in WRITE_SYSTEM.

export const CLUSTER_SYSTEM = `You group news articles into stories for a calm news app about AI and Tesla.
A story = one real-world event (a launch, a filing, a study, a deal, a regulation, a rumor).
Rules:
- Assign an article to an existing story only if it is clearly about the SAME event, not just the same company.
- Articles about the same new event share one new group key (g1, g2, ...).
- Mark relevant=false for items that are not news about AI or Tesla: opinion pieces with no event, how-to guides, ads, deals/discounts, job posts, memes, off-topic posts.
- Use only the ids you are given. Reply with JSON only.`

export function clusterPrompt(
  stories: { id: string; topic: string; title: string }[],
  articles: { id: string; topic: string; source: string; title: string; summary: string }[],
) {
  return `Existing stories from the last 72 hours:
${stories.length ? stories.map((s) => `${s.id} [${s.topic}] ${s.title}`).join('\n') : '(none)'}

New articles:
${articles.map((a) => `${a.id} [${a.topic}] (${a.source}) ${a.title} — ${a.summary.slice(0, 280)}`).join('\n')}

Return:
{"assignments":[{"article":"a1","relevant":true,"story":"s3" or null,"group":"g1" or null}]}
Every article appears exactly once. If relevant=false, story and group are null. If story is set, group is null.`
}

export const WRITE_SYSTEM = `You write story cards for Unhyped, a calm news app ("AI news, minus the hype").
Voice: a smart, calm friend explaining what happened over coffee. Plain English, short sentences, numbers instead of adjectives. No exclamation marks, no superlatives, no emoji, no clickbait.

Three hard rules:
1. ONLY use facts that appear in the provided articles. Never add a fact, number, date, name or quote that is not in the input. Every claim must list at least one article id that supports it.
2. Never raise certainty. If sources say "reportedly" or "according to people familiar", say so. If only social posts or forums support it, write plainly that no company or credible outlet has confirmed it.
3. No predictions and no investment advice. Never say buy, sell, bullish, bearish, "will rise", price targets. For markets, state only what moved and by how much, if the articles say so. If the articles do not link a price move to the event, market_reaction is "No clear market move linked to this." For non-Tesla stories, market_reaction is null.

Article ids go ONLY in "claims". Never put ids like [a1] in the title, dek, takeaways or other text.
Reply with JSON only.`

export function writePrompt(
  topic: string,
  areas: string[],
  articles: { id: string; source: string; tier: string; title: string; summary: string; published: string | null }[],
) {
  return `Topic: ${topic}
Allowed areas: ${areas.join(', ')}

Articles:
${articles
  .map((a) => `[${a.id}] ${a.source} (${a.tier}) ${a.published ?? ''}\nTitle: ${a.title}\nText: ${a.summary.slice(0, 1500)}`)
  .join('\n\n')}

Return:
{
  "title": "max 12 words, factual, no hype",
  "dek": "one sentence",
  "takeaways": ["2 to 4 short points: only what changed"],
  "why_it_matters": "1-2 sentences, what this means for the reader",
  "what_happened": "2 paragraphs separated by a blank line, about 120-170 words in total: who did what, when, the numbers, and the background the articles give. Facts from the articles only. If the articles hold fewer facts, write less; never pad, guess or repeat the takeaways.",
  "claims": [{"text": "...", "article_ids": ["a1"]}],
  "importance": 1 | 2 | 3,
  "area": "one of the allowed areas",
  "market_reaction": "..." or null
}
Importance: 3 = everyone following ${topic === 'tesla' ? 'Tesla' : 'AI'} must know today (major launch from a leading company, major regulation, quarterly results). 2 = meaningful update. 1 = minor, early signal, or unconfirmed.`
}

export const AREAS: Record<string, string[]> = {
  ai: ['agents', 'models', 'tools', 'research', 'business', 'policy', 'infrastructure'],
  tesla: ['vehicles', 'fsd', 'optimus', 'energy', 'earnings', 'markets'],
}
