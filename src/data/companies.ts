// Company teardowns: what a company does, as parts of one machine.
// Every line here must come from the company's own pages (see `source`) and is checked by an editor before it ships.

export type PartKind = 'gate' | 'rack' | 'scanner' | 'dock' | 'cluster' | 'devices'

export interface CompanyPart {
  id: string
  name: string
  /** station kind, for companies drawn as a machine */
  kind?: PartKind
  /** words in a headline that point at this part (lower case) */
  match?: string[]
  /** One plain sentence: what it does, as a physical metaphor the drawing shows. */
  role: string
  /** One or two sentences from the company's own description. */
  what: string
}

export interface Company {
  id: string
  name: string
  /** One line: what the company sells and to whom. */
  line: string
  /** What travels through the machine. */
  unit: string
  parts: CompanyPart[]
  source: { label: string; url: string }
  /** Names in headlines that link a story to this company. */
  match: string[]
  /** 'machine' for services (a bench with one station per product), or the physical object we take apart */
  form: 'machine' | 'gpu' | 'car' | 'phone'
  /** facts are drafted from official pages; an editor approves them in the Companies tab, and approved text from the database replaces this draft */
  status: 'draft' | 'approved'
}

export const COMPANIES: Company[] = [
  {
    id: 'tesla',
    name: 'Tesla',
    line: 'Electric cars, the software that drives them, and batteries for homes and the grid.',
    unit: 'one electric car',
    match: ['tesla', 'elon musk', 'musk'],
    form: 'car',
    status: 'draft',
    source: { label: 'Tesla investor relations, ir.tesla.com', url: 'https://ir.tesla.com' },
    parts: [
      {
        id: 'drive',
        name: 'Motors & wheels',
        match: ['motor', 'motors', 'drive unit'],
        role: 'The muscle. An electric motor on each axle turns the wheels, with almost no moving parts.',
        what: 'Tesla designs its own electric motors and drive units; dual-motor cars carry one on each axle.',
      },
      {
        id: 'battery',
        name: 'Battery pack',
        match: ['battery', 'batteries', '4680', 'cells', 'energy', 'megapack', 'powerwall', 'powercore', 'storage', 'supercharger', 'charging', 'charger'],
        role: 'The fuel tank. Thousands of cells in the floor store the energy and stiffen the car.',
        what: 'The pack sits in the floor as part of the car’s structure. Tesla also builds its own 4680 cells, and sells the same battery know-how as Powerwall and Megapack.',
      },
      {
        id: 'computer',
        name: 'Self-driving computer',
        match: ['fsd', 'autopilot', 'self-driving', 'autonomy', 'robotaxi', 'ai5', 'ai4', 'computer', 'super intelligence', 'software', 'update'],
        role: 'The brain. It reads the cameras many times a second and decides how to steer and brake.',
        what: 'Every new Tesla has an onboard AI computer that runs Full Self-Driving (Supervised) from camera video.',
      },
      {
        id: 'body',
        name: 'Body',
        match: ['cybercab', 'model y', 'model 3', 'cybertruck', 'model s', 'model x', 'semi', 'deliveries', 'vehicle', 'vehicles', 'car', 'cars'],
        role: 'The shell. Big sections are cast in one piece instead of welded from dozens.',
        what: 'Tesla casts large parts of the body in single pieces, a method it calls Gigacasting, to build cars with fewer parts.',
      },
      {
        id: 'glass',
        name: 'Cameras & glass',
        match: ['camera', 'cameras', 'vision'],
        role: 'The eyes. Eight cameras around the car see the road; there is no radar or lidar.',
        what: 'Tesla’s driver assistance uses cameras only, which Tesla calls Tesla Vision.',
      },
    ],
  },
  {
    id: 'nvidia',
    name: 'Nvidia',
    line: 'Chips and software that train and run most of the world’s AI.',
    unit: 'one data-centre GPU',
    match: ['nvidia', 'jensen huang'],
    form: 'gpu',
    status: 'draft',
    source: { label: 'NVIDIA Blackwell architecture, nvidia.com', url: 'https://www.nvidia.com/en-us/data-center/technologies/blackwell-architecture/' },
    parts: [
      {
        id: 'board',
        name: 'Board & power',
        match: ['server', 'rack', 'nvl72', 'dgx'],
        role: 'The base. Power stages feed the chip, and the edge connector plugs it into the server.',
        what: 'The GPU module carries the chip package, its power delivery and the connectors that link it to the server and to other GPUs.',
      },
      {
        id: 'substrate',
        name: 'Package',
        match: ['packaging', 'cowos', 'tsmc'],
        role: 'The adapter. It fans the chip’s thousands of tiny contacts out to the board.',
        what: 'The dies and memory sit on one package, which connects them to each other and to the board underneath.',
      },
      {
        id: 'memory',
        name: 'HBM memory',
        match: ['hbm', 'memory'],
        role: 'Memory stacked like towers right beside the chip, so data has a short trip.',
        what: 'Blackwell GPUs use HBM3e, high-bandwidth memory stacked in layers next to the compute dies.',
      },
      {
        id: 'die',
        name: 'GPU dies',
        match: ['blackwell', 'rubin', 'gpu', 'gpus', 'chip', 'chips'],
        role: 'The engine. Two dies joined into one GPU do the maths that trains and runs AI.',
        what: 'Blackwell packs 208 billion transistors into two dies, joined by a 10 TB/s chip-to-chip link so they work as one GPU.',
      },
      {
        id: 'lid',
        name: 'Heat spreader',
        match: [],
        role: 'The lid. It protects the dies and spreads their heat evenly.',
        what: 'A metal lid sits on top of the package and passes the heat from the dies to the cooler.',
      },
      {
        id: 'cooling',
        name: 'Cooling',
        match: ['cooling', 'liquid', 'power'],
        role: 'The radiator. Fins, or liquid cold plates in the newest racks, carry the heat away.',
        what: 'Top Blackwell systems such as GB200 NVL72 are liquid-cooled racks.',
      },
    ],
  },
  {
    id: 'apple',
    name: 'Apple',
    line: 'iPhone, Mac, iPad and Watch, plus the services that run on them.',
    unit: 'one iPhone',
    match: ['apple', 'iphone', 'tim cook'],
    form: 'phone',
    status: 'draft',
    source: { label: 'Apple, apple.com/iphone', url: 'https://www.apple.com/iphone/' },
    parts: [
      {
        id: 'back',
        name: 'Back glass & MagSafe',
        match: ['magsafe', 'wireless charging'],
        role: 'The back. A ring of magnets behind the glass snaps chargers and cases into place.',
        what: 'A magnet ring behind the back glass lines up MagSafe chargers and accessories.',
      },
      {
        id: 'cameras',
        name: 'Cameras',
        match: ['camera', 'cameras', 'photo', 'photos', 'video'],
        role: 'The eyes. Several lenses, each for a different distance.',
        what: 'Pro iPhones carry three rear cameras: main, ultra wide and telephoto.',
      },
      {
        id: 'battery',
        name: 'Battery',
        match: ['battery', 'battery life'],
        role: 'The fuel tank. It fills most of the space inside.',
        what: 'The battery takes up most of the phone’s inside; the board and cameras are packed around it.',
      },
      {
        id: 'chip',
        name: 'Apple silicon',
        match: ['chip', 'chips', 'silicon', 'processor', 'neural', 'apple intelligence', 'siri', 'ai'],
        role: 'The brain. A chip Apple designs itself, with a part made for AI.',
        what: 'iPhone, iPad and Mac run on chips Apple designs itself; each has a Neural Engine for on-device AI such as Apple Intelligence.',
      },
      {
        id: 'frame',
        name: 'Frame',
        match: ['titanium', 'aluminum', 'aluminium', 'design', 'fold', 'foldable', 'iphone air'],
        role: 'The skeleton. A metal rim holds every part in place.',
        what: 'The metal frame holds the phone together; recent models have used titanium and aluminium.',
      },
      {
        id: 'display',
        name: 'Display & services',
        match: ['display', 'screen', 'ios', 'app store', 'icloud', 'apple music', 'apple tv', 'services', 'apple pay'],
        role: 'The window. iOS and Apple’s paid services live on this screen.',
        what: 'The screen is where iOS, the App Store, iCloud and Apple Music meet the user. Services are Apple’s second-biggest business after iPhone.',
      },
    ],
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    line: 'Software and cloud for work, plus Windows, GitHub and Xbox.',
    unit: 'a customer’s work',
    match: ['microsoft', 'satya nadella'],
    form: 'machine',
    status: 'draft',
    source: { label: 'Microsoft Investor Relations, microsoft.com', url: 'https://www.microsoft.com/en-us/investor' },
    parts: [
      {
        id: 'azure',
        name: 'Azure',
        kind: 'cluster',
        match: ['azure', 'cloud', 'data center', 'data centers', 'datacenter'],
        role: 'The power plant. Rows of servers rent out computing to other companies.',
        what: 'Azure is Microsoft’s cloud: computing, storage and AI models that other companies rent.',
      },
      {
        id: 'copilot',
        name: 'Copilot',
        kind: 'scanner',
        match: ['copilot', 'mai', 'copilotforce'],
        role: 'The assistant arch. Work passes under it and comes out drafted, summed up or fixed.',
        what: 'Copilot is Microsoft’s AI assistant, built into Windows, Microsoft 365, GitHub and Edge.',
      },
      {
        id: 'm365',
        name: 'Microsoft 365',
        kind: 'rack',
        match: ['microsoft 365', 'office', 'teams', 'outlook', 'excel', 'word'],
        role: 'The office shelves. Documents, mail and meetings, stored and shared.',
        what: 'Microsoft 365 bundles Word, Excel, Outlook, Teams and cloud storage for people and businesses.',
      },
      {
        id: 'github',
        name: 'GitHub',
        kind: 'gate',
        match: ['github', 'codespaces'],
        role: 'The code gate. Software from millions of developers is checked in here.',
        what: 'GitHub hosts code for developers and companies, with Copilot for writing code.',
      },
      {
        id: 'windows',
        name: 'Windows & devices',
        kind: 'devices',
        match: ['windows', 'surface', 'pc', 'pcs'],
        role: 'The desks. Windows runs on the PCs people use every day.',
        what: 'Windows is the operating system on most of the world’s PCs; Surface is Microsoft’s own hardware.',
      },
      {
        id: 'xbox',
        name: 'Xbox & games',
        kind: 'dock',
        match: ['xbox', 'game', 'games', 'gaming', 'activision'],
        role: 'The shipping dock. Games go out to consoles, PCs and phones.',
        what: 'Xbox covers Microsoft’s consoles, Game Pass and studios including Activision Blizzard.',
      },
    ],
  },
  {
    id: 'google',
    name: 'Google',
    line: 'Search, YouTube, Android and Gemini, paid for mostly by ads, plus a cloud business.',
    unit: 'a question someone types',
    match: ['google', 'alphabet', 'deepmind', 'sundar pichai'],
    form: 'machine',
    status: 'draft',
    source: { label: 'Alphabet Investor Relations, abc.xyz', url: 'https://abc.xyz/investor/' },
    parts: [
      {
        id: 'search',
        name: 'Search & ads',
        kind: 'scanner',
        match: ['search', 'ads', 'advertising', 'chrome'],
        role: 'The reader. Every question is matched with answers, and with ads that pay for it.',
        what: 'Google Search answers billions of questions a day; ads next to the results earn most of Alphabet’s revenue.',
      },
      {
        id: 'gemini',
        name: 'Gemini',
        kind: 'rack',
        match: ['gemini', 'bard', 'ai mode', 'tasks agent', 'agent'],
        role: 'The model shelf. One family of AI models serves every Google product.',
        what: 'Gemini is Google’s family of AI models, used in the Gemini app, Search, Workspace and Cloud.',
      },
      {
        id: 'youtube',
        name: 'YouTube',
        kind: 'dock',
        match: ['youtube', 'shorts'],
        role: 'The broadcast dock. Videos go out to viewers everywhere.',
        what: 'YouTube is Google’s video platform, paid for by ads and subscriptions.',
      },
      {
        id: 'cloud',
        name: 'Cloud & TPUs',
        kind: 'cluster',
        match: ['cloud', 'tpu', 'tpus', 'data center', 'data centers'],
        role: 'The power plant. Google rents out its servers and its own AI chips, TPUs.',
        what: 'Google Cloud sells computing, data tools and AI, running on Google’s own TPU chips as well as GPUs.',
      },
      {
        id: 'android',
        name: 'Android & Pixel',
        kind: 'devices',
        match: ['android', 'pixel', 'play store'],
        role: 'The phones. Android runs on most of the world’s smartphones.',
        what: 'Android is Google’s mobile operating system; Pixel is its own line of phones.',
      },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    line: 'AI models, sold through ChatGPT and to developers.',
    unit: 'a prompt',
    match: ['openai', 'chatgpt', 'sam altman'],
    form: 'machine',
    status: 'draft',
    source: { label: 'OpenAI, openai.com', url: 'https://openai.com/' },
    parts: [
      {
        id: 'chatgpt',
        name: 'ChatGPT',
        kind: 'scanner',
        match: ['chatgpt', 'gpt', 'agent', 'agents'],
        role: 'The front desk. People type, and the model answers.',
        what: 'ChatGPT is OpenAI’s assistant app, with free and paid plans for people and businesses.',
      },
      {
        id: 'api',
        name: 'API',
        kind: 'gate',
        match: ['api', 'developers', 'platform'],
        role: 'The side door. Other companies plug OpenAI’s models into their own products.',
        what: 'The OpenAI API lets developers build OpenAI’s models into their apps and pay per use.',
      },
      {
        id: 'codex',
        name: 'Codex',
        kind: 'rack',
        match: ['codex', 'coding', 'code'],
        role: 'The workshop. An agent that writes and fixes code.',
        what: 'Codex is OpenAI’s coding agent for developers.',
      },
      {
        id: 'sora',
        name: 'Sora',
        kind: 'dock',
        match: ['sora', 'video', 'image', 'images'],
        role: 'The film dock. Prompts go in, video comes out.',
        what: 'Sora is OpenAI’s video model and app.',
      },
      {
        id: 'compute',
        name: 'Compute',
        kind: 'cluster',
        match: ['stargate', 'compute', 'data center', 'data centers', 'chips'],
        role: 'The power plant. Huge data centres train and run the models.',
        what: 'OpenAI is building data centres with partners under the Stargate name.',
      },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    line: 'The Claude family of AI models, for people, businesses and developers.',
    unit: 'a request',
    match: ['anthropic', 'claude'],
    form: 'machine',
    status: 'draft',
    source: { label: 'Anthropic, anthropic.com', url: 'https://www.anthropic.com/' },
    parts: [
      {
        id: 'claude',
        name: 'Claude apps',
        kind: 'scanner',
        match: ['claude'],
        role: 'The front desk. People and teams ask Claude for help.',
        what: 'Claude is Anthropic’s assistant, on the web, desktop and phone, with plans for people and teams.',
      },
      {
        id: 'api',
        name: 'Developer platform',
        kind: 'gate',
        match: ['api', 'developers', 'platform', 'bedrock', 'vertex'],
        role: 'The side door. Companies build Claude into their own products.',
        what: 'Developers use Claude through Anthropic’s API and through cloud platforms like Amazon Bedrock and Google Cloud Vertex AI.',
      },
      {
        id: 'code',
        name: 'Claude Code',
        kind: 'rack',
        match: ['claude code', 'coding', 'code', 'agent', 'agents'],
        role: 'The workshop. An agent that writes and changes code with a developer.',
        what: 'Claude Code is Anthropic’s coding agent, used in the terminal, in code editors and on the web.',
      },
      {
        id: 'compute',
        name: 'Compute',
        kind: 'cluster',
        match: ['compute', 'tpu', 'tpus', 'trainium', 'data center', 'data centers'],
        role: 'The power plant. Data centres train and run the models.',
        what: 'Anthropic trains and runs Claude on chips from several providers, including Google TPUs and Amazon Trainium.',
      },
    ],
  },
  {
    id: 'meta',
    name: 'Meta',
    line: 'Facebook, Instagram and WhatsApp, paid for by ads, plus AI and smart glasses.',
    unit: 'a post',
    match: ['meta', 'facebook', 'instagram', 'whatsapp', 'zuckerberg'],
    form: 'machine',
    status: 'draft',
    source: { label: 'Meta Investor Relations, investor.atmeta.com', url: 'https://investor.atmeta.com/' },
    parts: [
      {
        id: 'apps',
        name: 'Facebook, Instagram, WhatsApp',
        kind: 'dock',
        match: ['facebook', 'instagram', 'whatsapp', 'threads', 'messenger'],
        role: 'The broadcast dock. Posts and messages go out to billions of people.',
        what: 'Meta’s apps (Facebook, Instagram, WhatsApp, Messenger and Threads) are used by billions of people every day.',
      },
      {
        id: 'ads',
        name: 'Ads',
        kind: 'scanner',
        match: ['ads', 'advertising'],
        role: 'The matcher. Each post slot is matched with an ad, which pays for everything.',
        what: 'Almost all of Meta’s revenue comes from ads shown in its apps.',
      },
      {
        id: 'ai',
        name: 'Meta AI & Llama',
        kind: 'rack',
        match: ['llama', 'meta ai', 'superintelligence'],
        role: 'The model shelf. Meta’s own AI models, some released openly.',
        what: 'Meta AI is the assistant inside Meta’s apps; Llama is Meta’s family of openly released models.',
      },
      {
        id: 'glasses',
        name: 'Glasses & Quest',
        kind: 'devices',
        match: ['quest', 'glasses', 'ray-ban', 'vr', 'reality labs'],
        role: 'The wearables. Smart glasses and headsets.',
        what: 'Reality Labs makes Ray-Ban Meta glasses and Quest headsets.',
      },
      {
        id: 'compute',
        name: 'Data centres',
        kind: 'cluster',
        match: ['data center', 'data centers', 'compute'],
        role: 'The power plant. Huge data centres train the models and rank the feeds.',
        what: 'Meta is spending heavily on new data centres for AI.',
      },
    ],
  },
  {
    id: 'jfrog',
    name: 'JFrog',
    line: 'Software that stores, checks and ships the files other software is built from.',
    unit: 'a software package',
    match: ['jfrog'],
    form: 'machine',
    status: 'draft',
    source: { label: 'JFrog Platform overview, docs.jfrog.com', url: 'https://docs.jfrog.com/setup/docs/get-started/jfrog-platform-overview' },
    parts: [
      {
        id: 'curation',
        match: ['curation'],
        name: 'Curation',
        kind: 'gate',
        role: 'The gate at the door. Risky packages from the internet are turned away before they come in.',
        what: 'Works at the moment a team downloads an open-source package, and keeps risky dependencies out of its repositories before they are used.',
      },
      {
        id: 'artifactory',
        match: ['artifactory'],
        name: 'Artifactory',
        kind: 'rack',
        role: 'The warehouse. Every file a team builds is stored on a shelf, labelled with its version.',
        what: 'Automates and manages binaries and artifacts from build to release. It is the source of truth the other parts read from.',
      },
      {
        id: 'xray',
        match: ['xray','security'],
        name: 'Xray & Advanced Security',
        kind: 'scanner',
        role: 'The scanner arch. Each package passes under it and is checked for known security holes and licence problems.',
        what: 'Xray finds open-source vulnerabilities and licence violations before production. Advanced Security also scans source code and binaries with JFrog’s own engines.',
      },
      {
        id: 'distribution',
        match: ['distribution'],
        name: 'Distribution',
        kind: 'dock',
        role: 'The loading dock. Finished releases are sealed into a bundle and sent out on several rails at once.',
        what: 'Distributes immutable release bundles and automates delivery of software updates.',
      },
      {
        id: 'runtime',
        match: ['runtime','kubernetes'],
        name: 'Runtime',
        kind: 'cluster',
        role: 'The running floor. Software that is live in Kubernetes is watched, with a gauge per cluster.',
        what: 'Gives security and operational insight into Kubernetes environments, with Artifactory kept as the source of truth.',
      },
      {
        id: 'connect',
        match: ['iot','connect'],
        name: 'Connect',
        kind: 'devices',
        role: 'The antenna rack. Updates go out to fleets of devices in the field.',
        what: 'Secures the development lifecycle of connected (IoT) devices, from managing files to deploying updates across fleets.',
      },
    ],
  },
]

export const companyById = (id: string) => COMPANIES.find((c) => c.id === id)

/** The first company named in a headline, if we have its teardown. */
export function companyIn(title: string) {
  const t = title.toLowerCase()
  return COMPANIES.find((c) => c.match.some((m) => new RegExp(`\\b${m}\\b`).test(t)))
}
