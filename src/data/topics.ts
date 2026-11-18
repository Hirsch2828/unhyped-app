import type { Depth, Topic } from './types'
import { CATALOG, SECTORS, TOPIC_IDS, topicsOf, type SectorId } from '../../supabase/functions/_shared/catalog'

// Every topic in the catalog (11 sectors, 35 topics). The catalog itself is shared with the edge functions.
export const topicInfo: Record<Topic, { name: string; desc: string; image: string; sector: SectorId; glyph: string }> = Object.fromEntries(
  CATALOG.map((t) => [
    t.id,
    { name: t.name, desc: t.desc, image: t.id === 'tesla' ? 'img/tesla-card.jpg' : t.id === 'nvidia' || t.id === 'chips' ? 'img/chip.jpg' : 'img/robot-portrait.jpg', sector: t.sector, glyph: SECTORS.find((x) => x.id === t.sector)!.glyph },
  ]),
)

export const allTopics: Topic[] = TOPIC_IDS
export { SECTORS, topicsOf }
export type { SectorId }

const generic = [
  { id: 'business', name: 'Business & deals', desc: 'Companies, deals and strategy', icon: 'BarChart3' },
  { id: 'products', name: 'Products & launches', desc: 'What launched and what changed', icon: 'Sparkles' },
  { id: 'policy', name: 'Policy & regulation', desc: 'Laws, rules and regulators', icon: 'Landmark' },
  { id: 'earnings', name: 'Earnings & markets', desc: 'Results and what moved. No advice.', icon: 'BarChart3' },
]

export const areas: Record<Topic, { id: string; name: string; desc: string; icon: string }[]> = {
  ...Object.fromEntries(TOPIC_IDS.map((t) => [t, generic])),
  ai: [
    { id: 'agents', name: 'AI agents', desc: 'Autonomous systems and real-world use', icon: 'Bot' },
    { id: 'models', name: 'Models', desc: 'New models, features and capabilities', icon: 'Sparkles' },
    { id: 'tools', name: 'Tools & apps', desc: 'Product launches and practical use', icon: 'Wrench' },
    { id: 'research', name: 'Research', desc: 'Scientific progress and breakthroughs', icon: 'FlaskConical' },
    { id: 'business', name: 'Business & industry', desc: 'Companies, deals and strategy', icon: 'BarChart3' },
    { id: 'policy', name: 'Policy', desc: 'Laws, regulation and safety', icon: 'Landmark' },
    { id: 'infrastructure', name: 'Infrastructure', desc: 'Chips, data centers and compute', icon: 'Database' },
  ],
  tesla: [
    { id: 'vehicles', name: 'Vehicles', desc: 'New models and deliveries', icon: 'Car' },
    { id: 'fsd', name: 'FSD & autonomy', desc: 'Driver assist and robotaxi', icon: 'Navigation' },
    { id: 'optimus', name: 'Optimus', desc: 'Tesla’s humanoid robot', icon: 'Bot' },
    { id: 'tesla-energy', name: 'Energy', desc: 'Batteries and storage', icon: 'BatteryCharging' },
    { id: 'earnings', name: 'Earnings & markets', desc: 'Results and what moved. No advice.', icon: 'BarChart3' },
  ],
  nvidia: [
    { id: 'gpus', name: 'GPUs & chips', desc: 'New GPUs and chip launches', icon: 'Cpu' },
    { id: 'datacenter', name: 'Data centers', desc: 'AI servers, racks and cloud deals', icon: 'Database' },
    { id: 'earnings', name: 'Earnings & markets', desc: 'Results and what moved. No advice.', icon: 'BarChart3' },
    { id: 'supply', name: 'Supply chain', desc: 'TSMC, memory and manufacturing', icon: 'Factory' },
    { id: 'policy', name: 'Policy', desc: 'Export rules and regulation', icon: 'Landmark' },
  ],
}

export const depthInfo: Record<Depth, { name: string; desc: string; icon: string }> = {
  essentials: { name: '2 minutes', desc: 'Only the big news.', icon: 'Sun' },
  balanced: { name: '5 minutes', desc: 'The big news and the meaningful updates.', icon: 'BarChart3' },
  everything: { name: '15 minutes', desc: 'Everything relevant, including early signals.', icon: 'List' },
}
