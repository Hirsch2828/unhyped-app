import type { Depth, Topic } from './types'

export const topicInfo: Record<Topic, { name: string; desc: string; image: string }> = {
  ai: { name: 'AI', desc: 'Models, tools, research and real-world use', image: 'img/robot-portrait.jpg' },
  tesla: { name: 'Tesla', desc: 'Vehicles, autonomy, robots and energy', image: 'img/tesla-card.jpg' },
  robotics: { name: 'Robotics', desc: 'Humanoid robots and automation', image: 'img/robot-arm.jpg' },
  chips: { name: 'Semiconductors', desc: 'Chips, hardware and infrastructure', image: 'img/chip.jpg' },
  energy: { name: 'Energy', desc: 'Renewables, storage and grid innovation', image: 'img/energy.jpg' },
  markets: { name: 'Markets', desc: 'What moved and why. Never buy or sell advice.', image: 'img/markets.jpg' },
}

// Launch topics only. The other topics stay defined for later.
export const allTopics: Topic[] = ['ai', 'tesla']

export const areas: Record<Topic, { id: string; name: string; desc: string; icon: string }[]> = {
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
  robotics: [
    { id: 'humanoids', name: 'Humanoids', desc: 'General-purpose robots', icon: 'Bot' },
    { id: 'factory', name: 'Automation', desc: 'Robots in factories and warehouses', icon: 'Factory' },
  ],
  chips: [
    { id: 'infra', name: 'Infrastructure', desc: 'Computing, data centers and AI hardware', icon: 'Database' },
    { id: 'chip-launches', name: 'New chips', desc: 'Launches and benchmarks', icon: 'Cpu' },
  ],
  energy: [
    { id: 'renewables', name: 'Renewables', desc: 'Solar, wind and big deals', icon: 'Wind' },
    { id: 'grid', name: 'Grid & storage', desc: 'Batteries and power for AI', icon: 'Zap' },
  ],
  markets: [
    { id: 'moves', name: 'Market moves', desc: 'What moved and why', icon: 'TrendingUp' },
    { id: 'earnings', name: 'Earnings', desc: 'Results, explained simply', icon: 'FileText' },
  ],
}

export const depthInfo: Record<Depth, { name: string; desc: string; icon: string }> = {
  essentials: { name: 'Just the big news', desc: 'Only the most important developments.', icon: 'Sun' },
  balanced: { name: 'Important news', desc: 'Key developments and meaningful updates.', icon: 'BarChart3' },
  everything: { name: 'Everything relevant', desc: 'All relevant news, including early signals and smaller updates.', icon: 'List' },
}
