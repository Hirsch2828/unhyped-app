// The physical objects we take apart, by company form. Built lazily and cached: each is a few hundred paths.
import type { Company } from '../../../data/companies'
import type { Exploded } from '../exploded'
import { buildGpu } from './gpu'
import { buildCar } from './car'
import { buildPhone } from './phone'

const builders: Partial<Record<Company['form'], () => Exploded>> = { gpu: buildGpu, car: buildCar, phone: buildPhone }
const cache = new Map<string, Exploded>()

export function objectFor(form: Company['form']): Exploded | null {
  const b = builders[form]
  if (!b) return null
  if (!cache.has(form)) cache.set(form, b())
  return cache.get(form)!
}
