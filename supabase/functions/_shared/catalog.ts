// The topic catalog (milestone 5י): 11 S&P sectors, 35 specific topics.
// One source of truth, imported by the edge functions and by the site. Pure data: no Deno or browser APIs.
// Topic ids are stable: they are stored on sources, articles, stories and in readers' preferences.

export type SectorId =
  | 'tech' | 'comms' | 'discretionary' | 'staples' | 'energy' | 'financials'
  | 'health' | 'industrials' | 'materials' | 'realestate' | 'utilities'

export interface Sector { id: SectorId; name: string; desc: string; glyph: string }

export interface CatalogTopic {
  id: string
  sector: SectorId
  name: string
  desc: string
  /** whole words that mark an article as being about this topic (used to filter broad feeds) */
  keywords: string[]
  /** US tickers for the price chart */
  tickers: string[]
  /** sub-areas the writer may file a story under */
  areas: string[]
}

export const SECTORS: Sector[] = [
  { id: 'tech', name: 'Technology', desc: 'AI, chips, software and the big platforms', glyph: '⌘' },
  { id: 'comms', name: 'Communication', desc: 'Search, social, streaming and telecom', glyph: '◎' },
  { id: 'discretionary', name: 'Consumer Discretionary', desc: 'Cars, e-commerce and brands', glyph: '◇' },
  { id: 'staples', name: 'Consumer Staples', desc: 'Food, drink and the big grocers', glyph: '▤' },
  { id: 'energy', name: 'Energy', desc: 'Oil, gas, solar and nuclear', glyph: 'ϟ' },
  { id: 'financials', name: 'Financials', desc: 'Banks, the Fed, crypto and payments', glyph: '$' },
  { id: 'health', name: 'Health Care', desc: 'Drugs, biotech and insurers', glyph: '+' },
  { id: 'industrials', name: 'Industrials', desc: 'Defense, space and airlines', glyph: '△' },
  { id: 'materials', name: 'Materials', desc: 'Lithium, gold, mining and chemicals', glyph: '◆' },
  { id: 'realestate', name: 'Real Estate', desc: 'Housing, mortgages and data centers', glyph: '⌂' },
  { id: 'utilities', name: 'Utilities', desc: 'The grid and power for AI', glyph: '≋' },
]

const GENERIC = ['business', 'products', 'policy', 'earnings']

export const CATALOG: CatalogTopic[] = [
  // Technology
  { id: 'ai', sector: 'tech', name: 'AI & LLMs', desc: 'OpenAI, Anthropic, Gemini, Llama and the tools built on them', keywords: ['AI', 'artificial intelligence', 'LLM', 'OpenAI', 'ChatGPT', 'Anthropic', 'Claude', 'Gemini', 'Llama', 'Mistral', 'DeepSeek', 'xAI', 'Grok'], tickers: ['MSFT', 'GOOGL', 'META', 'AMZN'], areas: ['agents', 'models', 'tools', 'research', 'business', 'policy', 'infrastructure'] },
  { id: 'nvidia', sector: 'tech', name: 'Nvidia', desc: 'GPUs, data centers and the whole chip race', keywords: ['Nvidia', 'NVDA', 'Jensen Huang', 'Blackwell', 'CUDA'], tickers: ['NVDA'], areas: ['chips', 'datacenter', 'earnings', 'supply', 'policy', 'markets'] },
  { id: 'apple', sector: 'tech', name: 'Apple', desc: 'iPhone, Mac, Vision Pro and services', keywords: ['Apple', 'iPhone', 'iPad', 'MacBook', 'Mac', 'Vision Pro', 'iOS', 'Tim Cook', 'App Store'], tickers: ['AAPL'], areas: GENERIC },
  { id: 'microsoft', sector: 'tech', name: 'Microsoft', desc: 'Windows, Azure, Copilot and Xbox', keywords: ['Microsoft', 'Azure', 'Copilot', 'Windows', 'Xbox', 'Satya Nadella', 'LinkedIn'], tickers: ['MSFT'], areas: GENERIC },
  { id: 'chips', sector: 'tech', name: 'Chips', desc: 'AMD, TSMC, Intel, Broadcom and the fabs', keywords: ['AMD', 'TSMC', 'Intel', 'Broadcom', 'Qualcomm', 'ASML', 'Micron', 'semiconductor', 'semiconductors', 'chipmaker', 'foundry', 'Arm'], tickers: ['AMD', 'TSM', 'INTC', 'AVGO', 'QCOM', 'MU', 'ASML'], areas: GENERIC },
  { id: 'cyber', sector: 'tech', name: 'Cybersecurity', desc: 'Breaches, ransomware and the companies that stop them', keywords: ['breach', 'ransomware', 'hack', 'hackers', 'cyberattack', 'vulnerability', 'CrowdStrike', 'Palo Alto Networks', 'malware', 'zero-day'], tickers: ['CRWD', 'PANW'], areas: GENERIC },
  { id: 'cloud', sector: 'tech', name: 'Cloud & software', desc: 'AWS, Oracle, Salesforce and enterprise software', keywords: ['cloud', 'AWS', 'Oracle', 'Salesforce', 'SaaS', 'Snowflake', 'ServiceNow', 'SAP', 'Adobe', 'Datadog'], tickers: ['ORCL', 'CRM', 'NOW', 'SNOW', 'ADBE'], areas: GENERIC },
  // Communication
  { id: 'google', sector: 'comms', name: 'Google', desc: 'Search, YouTube, Android and Alphabet', keywords: ['Google', 'Alphabet', 'YouTube', 'Android', 'Sundar Pichai', 'Waymo', 'Chrome'], tickers: ['GOOGL'], areas: GENERIC },
  { id: 'meta', sector: 'comms', name: 'Meta', desc: 'Facebook, Instagram, WhatsApp and smart glasses', keywords: ['Meta', 'Facebook', 'Instagram', 'WhatsApp', 'Threads', 'Zuckerberg', 'Ray-Ban Meta', 'Quest'], tickers: ['META'], areas: GENERIC },
  { id: 'streaming', sector: 'comms', name: 'Streaming', desc: 'Netflix, Disney+, Spotify and the box office', keywords: ['Netflix', 'Disney', 'Spotify', 'streaming', 'Warner Bros', 'Paramount', 'HBO', 'box office'], tickers: ['NFLX', 'DIS', 'SPOT'], areas: GENERIC },
  { id: 'telecom', sector: 'comms', name: 'Telecom', desc: 'Verizon, AT&T, T-Mobile and satellite internet', keywords: ['Verizon', 'AT&T', 'T-Mobile', 'telecom', '5G', 'broadband', 'Starlink', 'carrier'], tickers: ['VZ', 'T', 'TMUS'], areas: GENERIC },
  // Consumer Discretionary
  { id: 'tesla', sector: 'discretionary', name: 'Tesla', desc: 'Cars, FSD, robotaxi, Optimus and energy', keywords: ['Tesla', 'TSLA', 'Elon Musk', 'Cybertruck', 'Model Y', 'Model 3', 'FSD', 'Robotaxi', 'Optimus', 'Megapack'], tickers: ['TSLA'], areas: ['vehicles', 'fsd', 'optimus', 'energy', 'earnings', 'markets'] },
  { id: 'amazon', sector: 'discretionary', name: 'Amazon', desc: 'Shopping, Prime, AWS and Kuiper', keywords: ['Amazon', 'Prime', 'Andy Jassy', 'Alexa', 'Kuiper', 'AWS'], tickers: ['AMZN'], areas: GENERIC },
  { id: 'evs', sector: 'discretionary', name: 'EVs', desc: 'Rivian, BYD, Lucid and the car makers going electric', keywords: ['EV', 'EVs', 'electric vehicle', 'electric vehicles', 'Rivian', 'BYD', 'Lucid', 'Polestar', 'charging', 'GM', 'Ford'], tickers: ['RIVN', 'LCID', 'GM', 'F'], areas: GENERIC },
  { id: 'retail', sector: 'discretionary', name: 'Retail & brands', desc: 'Nike, Starbucks, McDonald’s, Home Depot and shoppers', keywords: ['Nike', 'Starbucks', "McDonald's", 'Home Depot', 'Target', 'retail', 'retailer', 'shoppers', 'Lululemon', 'Chipotle'], tickers: ['NKE', 'SBUX', 'MCD', 'HD', 'TGT'], areas: GENERIC },
  // Consumer Staples
  { id: 'food', sector: 'staples', name: 'Food & drink', desc: 'Coca-Cola, PepsiCo, Nestlé and what we eat', keywords: ['Coca-Cola', 'PepsiCo', 'Nestle', 'Nestlé', 'Kraft Heinz', 'Mondelez', 'food prices', 'beverage', 'snack'], tickers: ['KO', 'PEP', 'MDLZ'], areas: GENERIC },
  { id: 'grocers', sector: 'staples', name: 'Walmart & Costco', desc: 'The big grocers and what shoppers pay', keywords: ['Walmart', 'Costco', 'Kroger', 'grocery', 'grocer', 'Albertsons'], tickers: ['WMT', 'COST', 'KR'], areas: GENERIC },
  // Energy
  { id: 'oil', sector: 'energy', name: 'Oil & gas', desc: 'Exxon, Chevron, OPEC and the price of a barrel', keywords: ['oil', 'crude', 'OPEC', 'Exxon', 'ExxonMobil', 'Chevron', 'Brent', 'natural gas', 'LNG', 'Shell', 'BP', 'refinery'], tickers: ['XOM', 'CVX', 'COP'], areas: GENERIC },
  { id: 'solar', sector: 'energy', name: 'Solar & clean energy', desc: 'Solar, wind, batteries and the money behind them', keywords: ['solar', 'wind', 'renewable', 'renewables', 'First Solar', 'Enphase', 'clean energy', 'battery storage', 'offshore wind'], tickers: ['FSLR', 'ENPH', 'NEE'], areas: GENERIC },
  { id: 'nuclear', sector: 'energy', name: 'Nuclear', desc: 'Reactors, SMRs and uranium', keywords: ['nuclear', 'reactor', 'reactors', 'uranium', 'SMR', 'fusion', 'Cameco', 'Oklo', 'NuScale'], tickers: ['CCJ', 'OKLO', 'SMR', 'CEG'], areas: GENERIC },
  // Financials
  { id: 'banks', sector: 'financials', name: 'Banks & the Fed', desc: 'Interest rates, JPMorgan, Goldman and the Fed', keywords: ['Federal Reserve', 'Fed', 'interest rates', 'rate cut', 'Powell', 'JPMorgan', 'Goldman Sachs', 'Bank of America', 'Morgan Stanley', 'Wells Fargo', 'inflation'], tickers: ['JPM', 'GS', 'BAC', 'MS'], areas: GENERIC },
  { id: 'crypto', sector: 'financials', name: 'Crypto & Bitcoin', desc: 'Bitcoin, Ethereum, ETFs and the companies holding them', keywords: ['Bitcoin', 'BTC', 'Ethereum', 'crypto', 'cryptocurrency', 'stablecoin', 'Coinbase', 'MicroStrategy', 'Solana', 'Bitcoin ETF', 'MSTR'], tickers: ['COIN', 'MSTR', 'IBIT'], areas: GENERIC },
  { id: 'fintech', sector: 'financials', name: 'Fintech & payments', desc: 'Visa, PayPal, Stripe and how money moves', keywords: ['Visa', 'Mastercard', 'PayPal', 'Stripe', 'Block', 'Robinhood', 'fintech', 'payments', 'Klarna', 'Affirm'], tickers: ['V', 'MA', 'PYPL', 'HOOD'], areas: GENERIC },
  // Health Care
  { id: 'glp1', sector: 'health', name: 'Weight-loss drugs', desc: 'Ozempic, Wegovy, Zepbound and the race behind them', keywords: ['Ozempic', 'Wegovy', 'Zepbound', 'Mounjaro', 'GLP-1', 'semaglutide', 'tirzepatide', 'Novo Nordisk', 'Eli Lilly', 'obesity'], tickers: ['LLY', 'NVO'], areas: GENERIC },
  { id: 'biotech', sector: 'health', name: 'Biotech & FDA', desc: 'Drug approvals, trials and big pharma deals', keywords: ['FDA', 'biotech', 'clinical trial', 'approval', 'Pfizer', 'Moderna', 'Merck', 'AbbVie', 'gene therapy', 'drugmaker'], tickers: ['PFE', 'MRK', 'ABBV', 'MRNA'], areas: GENERIC },
  { id: 'insurers', sector: 'health', name: 'Health insurers', desc: 'UnitedHealth, CVS, Medicare and what care costs', keywords: ['UnitedHealth', 'CVS', 'Humana', 'Cigna', 'Elevance', 'Medicare', 'Medicaid', 'health insurer', 'health insurance'], tickers: ['UNH', 'CVS', 'CI'], areas: GENERIC },
  // Industrials
  { id: 'defense', sector: 'industrials', name: 'Aerospace & defense', desc: 'Boeing, Lockheed, Airbus and defense budgets', keywords: ['Boeing', 'Lockheed Martin', 'Airbus', 'RTX', 'Northrop Grumman', 'defense', 'Pentagon', 'Anduril', 'Palantir', 'fighter jet'], tickers: ['BA', 'LMT', 'RTX', 'NOC', 'PLTR'], areas: GENERIC },
  { id: 'space', sector: 'industrials', name: 'Space', desc: 'SpaceX, Blue Origin, NASA and satellites', keywords: ['SpaceX', 'Starship', 'Falcon 9', 'Blue Origin', 'NASA', 'Rocket Lab', 'satellite', 'launch', 'orbit', 'Starlink'], tickers: ['RKLB'], areas: GENERIC },
  { id: 'airlines', sector: 'industrials', name: 'Airlines', desc: 'Delta, United, fares and air travel', keywords: ['airline', 'airlines', 'Delta', 'United Airlines', 'American Airlines', 'Southwest', 'FAA', 'flights', 'airfare'], tickers: ['DAL', 'UAL', 'AAL', 'LUV'], areas: GENERIC },
  // Materials
  { id: 'lithium', sector: 'materials', name: 'Lithium & battery metals', desc: 'Lithium, nickel, cobalt and rare earths', keywords: ['lithium', 'nickel', 'cobalt', 'rare earth', 'rare earths', 'Albemarle', 'MP Materials', 'graphite', 'battery metals'], tickers: ['ALB', 'MP'], areas: GENERIC },
  { id: 'gold', sector: 'materials', name: 'Gold & mining', desc: 'Gold, silver, copper and the miners', keywords: ['gold', 'silver', 'copper', 'mining', 'miner', 'Newmont', 'Barrick', 'Freeport', 'BHP', 'Rio Tinto'], tickers: ['NEM', 'GOLD', 'FCX'], areas: GENERIC },
  { id: 'chemicals', sector: 'materials', name: 'Chemicals', desc: 'Dow, DuPont, fertilizer and industrial chemicals', keywords: ['chemical', 'chemicals', 'Dow', 'DuPont', 'BASF', 'fertilizer', 'LyondellBasell', 'plastics'], tickers: ['DOW', 'DD', 'LYB'], areas: GENERIC },
  // Real Estate
  { id: 'housing', sector: 'realestate', name: 'Housing & mortgages', desc: 'Home prices, mortgage rates and builders', keywords: ['housing', 'mortgage', 'mortgages', 'home prices', 'homebuilder', 'home sales', 'Zillow', 'rent', 'real estate'], tickers: ['DHI', 'LEN', 'Z'], areas: GENERIC },
  { id: 'datacenters', sector: 'realestate', name: 'Data-center real estate', desc: 'Equinix, Digital Realty and the AI building boom', keywords: ['data center', 'data centers', 'datacenter', 'Equinix', 'Digital Realty', 'hyperscale', 'colocation'], tickers: ['EQIX', 'DLR'], areas: GENERIC },
  // Utilities
  { id: 'power', sector: 'utilities', name: 'Power for AI', desc: 'The grid, utilities and the electricity AI needs', keywords: ['grid', 'utility', 'utilities', 'electricity', 'power demand', 'power plant', 'Constellation', 'Vistra', 'NextEra', 'Duke Energy', 'transmission'], tickers: ['CEG', 'VST', 'NEE', 'DUK'], areas: GENERIC },
]

export const TOPIC_IDS = CATALOG.map((t) => t.id)
export const topicById = new Map(CATALOG.map((t) => [t.id, t]))
export const topicsOf = (sector: SectorId) => CATALOG.filter((t) => t.sector === sector)
export const ALL_TICKERS = [...new Set([...CATALOG.flatMap((t) => t.tickers), 'FROG'])]

/** Whole-word, case-insensitive test of a text against a topic's keywords. */
export function keywordTest(words: string[]) {
  const esc = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return new RegExp(`(?:^|[^\\w])(${esc.join('|')})(?=$|[^\\w])`, 'i')
}
