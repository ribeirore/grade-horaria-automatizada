import type { Preferencia } from './domain/draft'

export interface Slot { day: number; start: number; end: number }
export interface Section {
  id: string
  periodo: string
  code: string
  label: string
  credits: number | null
  slots: Slot[]
}
export interface Course { code: string; name: string; sections: Section[] }
export interface Metrics {
  gapMinutes: number
  days: number
  classMinutes: number
  earliest: number
  latest: number
  averageStart: number
  averageEnd: number
  credits: number | null
}
export interface Grade { sections: Section[]; metrics: Metrics; signature: string }
export interface SolveRequest {
  periodo: string
  courses: Course[]
  blocks: Slot[]
  priorities: Preferencia[]
  maxNodes?: number
  maxMs?: number
  limit?: number
}
export interface SolveResult {
  grades: Grade[]
  complete: boolean
  feasibleCount: number
  nodes: number
  elapsedMs: number
  issues: string[]
}
