// Stage 1: Deterministic pre-filter for outfit generation
// Filters wardrobe items by season, formality, colour harmony, and pattern rules

export interface Item {
  id: string
  clothingType: string
  colour: string
  pattern: string
  material: string
  formalityLevel: string
  season: string
  imageUrl: string
}

export interface UserProfile {
  preferredColours?: string[]
  dislikedColours?: string[]
  formalityDefault?: string
  stylePreferences?: string[]
  climate?: string
  recentlyWornItemIds?: string[]  // item IDs worn in the last 7 days
}

// Colour wheel for harmony checks
const COLOUR_HARMONY: Record<string, string[]> = {
  'black': ['white', 'red', 'blue', 'gold', 'silver', 'grey', 'navy', 'burgundy', 'cream', 'pink'],
  'white': ['black', 'navy', 'red', 'blue', 'grey', 'brown', 'pink', 'green', 'yellow'],
  'navy': ['white', 'cream', 'pink', 'burgundy', 'gold', 'grey', 'light blue', 'tan'],
  'grey': ['black', 'white', 'navy', 'pink', 'yellow', 'red', 'blue'],
  'brown': ['cream', 'tan', 'white', 'blue', 'green', 'burgundy', 'orange'],
  'beige': ['navy', 'brown', 'white', 'olive', 'burgundy', 'black'],
  'cream': ['navy', 'brown', 'black', 'burgundy', 'olive', 'grey'],
  'red': ['black', 'white', 'grey', 'navy', 'cream'],
  'blue': ['white', 'grey', 'tan', 'brown', 'cream', 'navy'],
  'green': ['white', 'brown', 'cream', 'navy', 'tan', 'grey'],
  'burgundy': ['navy', 'cream', 'black', 'grey', 'tan'],
  'pink': ['grey', 'navy', 'white', 'black', 'cream']
}

// Formality levels in ascending order
const FORMALITY_ORDER = ['casual', 'smart_casual', 'business_casual', 'formal', 'black_tie']

// Occasion to formality mapping
const OCCASION_FORMALITY: Record<string, string[]> = {
  'casual': ['casual', 'smart_casual'],
  'work': ['smart_casual', 'business_casual', 'formal'],
  'date': ['smart_casual', 'business_casual', 'formal'],
  'formal': ['formal', 'black_tie'],
  'active': ['casual'],
}

// Current season helper
function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

function normalizeColour(colour: string): string {
  return colour.toLowerCase().trim()
}

function areColoursHarmonious(colour1: string, colour2: string): boolean {
  const c1 = normalizeColour(colour1)
  const c2 = normalizeColour(colour2)
  
  if (c1 === c2) return true // Monochromatic is fine
  
  const harmonious = COLOUR_HARMONY[c1] || []
  return harmonious.some(c => c2.includes(c) || c.includes(c2))
}

function hasPatternConflict(patterns: string[]): boolean {
  const nonSolid = patterns.filter(p => p !== 'solid')
  if (nonSolid.length <= 1) return false // One pattern + solids = OK
  
  // Multiple non-solid patterns: check if they're compatible
  const patternSet = new Set(nonSolid)
  if (patternSet.has('striped') && patternSet.has('checked')) return true
  if (patternSet.has('floral') && patternSet.has('graphic')) return true
  return false
}

function isInFormalityRange(itemFormality: string, occasion: string): boolean {
  const allowed = OCCASION_FORMALITY[occasion] || ['casual', 'smart_casual']
  return allowed.includes(itemFormality)
}

function matchesSeason(itemSeason: string, currentSeason: string): boolean {
  return itemSeason === 'all_season' || itemSeason === currentSeason
}

export function generateValidOutfits(items: Item[], profile: UserProfile, occasion: string) {
  const currentSeason = getCurrentSeason()
  
  // Step 1: Filter by season and formality
  let filtered = items.filter(item => 
    matchesSeason(item.season, currentSeason) &&
    isInFormalityRange(item.formalityLevel, occasion)
  )

  // Step 2: Filter out disliked colours
  if (profile.dislikedColours?.length) {
    filtered = filtered.filter(item =>
      !profile.dislikedColours!.some(disliked =>
        normalizeColour(item.colour).includes(normalizeColour(disliked))
      )
    )
  }

  // Step 3: Group by category
  const tops = filtered.filter(i => ['t-shirt', 'shirt', 'blouse', 'sweater', 'hoodie'].includes(i.clothingType))
  const bottoms = filtered.filter(i => ['jeans', 'trousers', 'shorts', 'skirt'].includes(i.clothingType))
  const outerwear = filtered.filter(i => ['jacket', 'coat'].includes(i.clothingType))
  const shoes = filtered.filter(i => ['shoes'].includes(i.clothingType))
  const fullBody = filtered.filter(i => ['dress'].includes(i.clothingType))

  const outfits: { items: Item[]; score: number }[] = []

  // Generate combinations: (top + bottom) OR (dress) + optional outerwear + optional shoes
  const baseCombinations: Item[][] = []

  for (const top of tops) {
    for (const bottom of bottoms) {
      baseCombinations.push([top, bottom])
    }
  }

  for (const dress of fullBody) {
    baseCombinations.push([dress])
  }

  for (const base of baseCombinations) {
    const baseColours = base.map(i => normalizeColour(i.colour))
    const basePatterns = base.map(i => i.pattern)

    // Check colour harmony within base
    let baseHarmonious = true
    for (let i = 0; i < baseColours.length; i++) {
      for (let j = i + 1; j < baseColours.length; j++) {
        if (!areColoursHarmonious(baseColours[i], baseColours[j])) {
          baseHarmonious = false
          break
        }
      }
      if (!baseHarmonious) break
    }
    if (!baseHarmonious) continue

    // Check pattern conflicts
    if (hasPatternConflict(basePatterns)) continue

    // Calculate score based on user preferences
    let score = 0

    // Boost for preferred colours
    if (profile.preferredColours?.length) {
      for (const item of base) {
        if (profile.preferredColours.some(pc =>
          normalizeColour(item.colour).includes(normalizeColour(pc))
        )) {
          score += 2
        }
      }
    }

    // Penalize recently worn items (deprioritize, don't exclude)
    if (profile.recentlyWornItemIds?.length) {
      for (const item of base) {
        if (profile.recentlyWornItemIds.includes(item.id)) {
          score -= 5
        }
      }
    }

    // Add optional outerwear that matches
    for (const ow of outerwear) {
      if (baseColours.every(c => areColoursHarmonious(c, ow.colour))) {
        const combo = [...base, ow]
        const patterns = combo.map(i => i.pattern)
        if (!hasPatternConflict(patterns)) {
          let comboScore = score + 1 // small bonus for layering

          // Penalize recently worn outerwear
          if (profile.recentlyWornItemIds?.includes(ow.id)) {
            comboScore -= 5
          }

          // Add shoes
          for (const shoe of shoes) {
            if (combo.every(item => areColoursHarmonious(item.colour, shoe.colour))) {
              let finalScore = comboScore + 1
              if (profile.recentlyWornItemIds?.includes(shoe.id)) {
                finalScore -= 5
              }
              outfits.push({ items: [...combo, shoe], score: finalScore })
            }
          }
        }
      }
    }

    // Also add without outerwear
    for (const shoe of shoes) {
      if (base.every(item => areColoursHarmonious(item.colour, shoe.colour))) {
        let shoeScore = score + 1
        if (profile.recentlyWornItemIds?.includes(shoe.id)) {
          shoeScore -= 5
        }
        outfits.push({ items: [...base, shoe], score: shoeScore })
      }
    }

    // And base only (no shoes/outerwear)
    outfits.push({ items: base, score })
  }

  // Sort by score descending and return top candidates
  return outfits
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(o => o.items)
}
