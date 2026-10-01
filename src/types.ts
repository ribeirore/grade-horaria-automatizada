export interface Slot { day: number; start: number; end: number }
export interface Section { id: string; label: string; credits: number; slots: Slot[] }
export interface Course { code: string; name: string; abbreviation: string; catalogMatched: boolean; sections: Section[] }
export interface Period { id: string; label: string; courses: Course[] }
export interface Dataset {
  meta: { sourceDate: string; sourceUrl: string; rawRows: number; rawSections: number; logicalSlots: number; includedSlots: number; missingCatalogCodes: number; excluded: { period: string; section: string; reason: string }[] }
  periods: Period[]
}
export interface Block extends Slot { id: string; label: string }
export interface Preferences { gaps: number; days: number; start: number; finish: number; startMode: 'early' | 'late' | 'neutral' }
export interface Metrics { gapMinutes: number; days: number; classMinutes: number; earliest: number; latest: number; averageStart: number; averageEnd: number; credits: number }
export interface Grade { sections: Section[]; metrics: Metrics; cost: number; signature: string }
export interface SolveRequest { courses: Course[]; blocks: Slot[]; preferences: Preferences; locks: Record<string, string>; maxNodes?: number; maxMs?: number; limit?: number }
export interface SolveResult { grades: Grade[]; complete: boolean; feasibleCount: number; nodes: number; elapsedMs: number; issues: string[] }
