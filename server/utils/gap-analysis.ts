export interface InventorySummary {
  totalItems: number
  byType: Record<string, number>
  byColour: Record<string, number>
  bySeason: Record<string, number>
  byFormality: Record<string, number>
  totalOutfits: number
  totalWearEvents: number
}

export interface DetectedGap {
  type: 'missing_category' | 'imbalance' | 'season_gap' | 'colour_concentration'
  detail: string
  severity: 'high' | 'medium' | 'low'
}

const TOPS = new Set(['t-shirt', 'shirt', 'blouse', 'sweater', 'hoodie'])
const BOTTOMS = new Set(['jeans', 'trousers', 'shorts', 'skirt'])

const ALL_CATEGORIES = [
  't-shirt', 'shirt', 'blouse', 'sweater', 'hoodie',
  'jacket', 'coat', 'jeans', 'trousers', 'shorts',
  'skirt', 'dress', 'shoes',
]

const SKIPPED_CATEGORIES = new Set(['other', 'accessory'])

/**
 * Run the full set of gap detection rules against an inventory summary.
 * Returns a list of detected gaps sorted by severity (high first).
 */
export function runGapRules(summary: InventorySummary): DetectedGap[] {
  const gaps: DetectedGap[] = []

  // 1. Missing categories — check every clothing type in the enum
  for (const category of ALL_CATEGORIES) {
    if (SKIPPED_CATEGORIES.has(category)) continue
    if ((summary.byType[category] ?? 0) === 0) {
      gaps.push({
        type: 'missing_category',
        detail: category,
        severity: 'high',
      })
    }
  }

  // 2. Tops-to-bottoms ratio
  const topsCount = Object.entries(summary.byType)
    .filter(([type]) => TOPS.has(type))
    .reduce((sum, [, count]) => sum + count, 0)

  const bottomsCount = Object.entries(summary.byType)
    .filter(([type]) => BOTTOMS.has(type))
    .reduce((sum, [, count]) => sum + count, 0)

  if (topsCount > 0 && bottomsCount === 0) {
    gaps.push({
      type: 'missing_category',
      detail: 'bottoms',
      severity: 'high',
    })
  } else if (bottomsCount > 0 && topsCount === 0) {
    gaps.push({
      type: 'missing_category',
      detail: 'tops',
      severity: 'high',
    })
  } else if (topsCount > 0 && bottomsCount > 0 && topsCount / bottomsCount > 3) {
    gaps.push({
      type: 'imbalance',
      detail: 'tops_bottoms_imbalance',
      severity: 'medium',
    })
  }

  // 3. Season coverage — only flag when the user has enough items
  if (summary.totalItems > 5) {
    if ((summary.bySeason['winter'] ?? 0) === 0) {
      gaps.push({
        type: 'season_gap',
        detail: 'winter',
        severity: 'medium',
      })
    }
    if ((summary.bySeason['summer'] ?? 0) === 0) {
      gaps.push({
        type: 'season_gap',
        detail: 'summer',
        severity: 'medium',
      })
    }
  }

  // 4. Colour concentration — any single colour >= 40% of total
  if (summary.totalItems > 3) {
    const threshold = summary.totalItems * 0.4
    for (const [colour, count] of Object.entries(summary.byColour)) {
      if (count >= threshold) {
        gaps.push({
          type: 'colour_concentration',
          detail: colour,
          severity: 'low',
        })
      }
    }
  }

  // Sort by severity: high first, then medium, then low
  const severityOrder = { high: 0, medium: 1, low: 2 }
  gaps.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return gaps
}
