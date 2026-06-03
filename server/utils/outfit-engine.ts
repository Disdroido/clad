// Stage 1: Deterministic pre-filter for outfit generation
// Filters wardrobe items by season, formality, colour harmony, and pattern rules
// Uses progressive relaxation when strict filtering produces too few candidates

export interface Item {
  id: string
  clothingType: string
  colour: string
  pattern: string
  material: string
  formalityLevel: string
  season: string
  imageUrl: string
  isClean?: boolean
  condition?: string
}

export interface UserProfile {
  preferredColours?: string[]
  dislikedColours?: string[]
  formalityDefault?: string
  stylePreferences?: string[]
  climate?: string
  recentlyWornItemIds?: string[]
  currentTemperature?: number
}

// Expanded colour wheel for harmony checks — covers common clothing colours
const COLOUR_HARMONY: Record<string, string[]> = {
  'black':     ['white', 'red', 'blue', 'gold', 'silver', 'grey', 'navy', 'burgundy', 'cream', 'pink', 'green', 'yellow', 'olive', 'tan', 'teal'],
  'white':     ['black', 'navy', 'red', 'blue', 'grey', 'brown', 'pink', 'green', 'yellow', 'tan', 'olive', 'teal', 'coral'],
  'navy':      ['white', 'cream', 'pink', 'burgundy', 'gold', 'grey', 'light blue', 'tan', 'brown', 'olive', 'coral', 'yellow'],
  'grey':      ['black', 'white', 'navy', 'pink', 'yellow', 'red', 'blue', 'green', 'burgundy', 'teal', 'lavender'],
  'brown':     ['cream', 'tan', 'white', 'blue', 'green', 'burgundy', 'orange', 'olive', 'navy', 'yellow', 'coral'],
  'beige':     ['navy', 'brown', 'white', 'olive', 'burgundy', 'black', 'tan', 'cream'],
  'cream':     ['navy', 'brown', 'black', 'burgundy', 'olive', 'grey', 'tan', 'green'],
  'tan':       ['navy', 'white', 'brown', 'cream', 'olive', 'burgundy', 'blue', 'green'],
  'red':       ['black', 'white', 'grey', 'navy', 'cream', 'tan', 'denim'],
  'blue':      ['white', 'grey', 'tan', 'brown', 'cream', 'navy', 'black', 'olive', 'yellow'],
  'green':     ['white', 'brown', 'cream', 'navy', 'tan', 'grey', 'black', 'yellow', 'olive'],
  'olive':     ['black', 'white', 'cream', 'tan', 'brown', 'navy', 'burgundy', 'grey'],
  'burgundy':  ['navy', 'cream', 'black', 'grey', 'tan', 'white', 'olive', 'pink'],
  'pink':      ['grey', 'navy', 'white', 'black', 'cream', 'tan', 'blue', 'burgundy'],
  'yellow':    ['navy', 'grey', 'white', 'black', 'brown', 'olive', 'green'],
  'orange':    ['navy', 'white', 'brown', 'cream', 'grey', 'olive', 'black'],
  'teal':      ['white', 'black', 'grey', 'navy', 'tan', 'cream', 'coral'],
  'coral':     ['navy', 'white', 'cream', 'grey', 'tan', 'teal', 'black'],
  'lavender':  ['grey', 'white', 'navy', 'black', 'cream', 'pink'],
  'maroon':    ['navy', 'cream', 'white', 'grey', 'tan', 'olive'],
  'denim':     ['white', 'black', 'grey', 'cream', 'red', 'navy', 'tan', 'olive'],
  'charcoal':  ['white', 'cream', 'navy', 'pink', 'red', 'blue', 'burgundy', 'tan', 'olive'],
}

// Colour aliases for fuzzy matching
const COLOUR_ALIASES: Record<string, string> = {
  'light blue': 'blue', 'dark blue': 'navy', 'navy blue': 'navy',
  'olive green': 'olive', 'army green': 'olive', 'forest green': 'green',
  'light pink': 'pink', 'hot pink': 'pink', 'dusty pink': 'pink',
  'light grey': 'grey', 'dark grey': 'charcoal', 'heather grey': 'grey',
  'off white': 'cream', 'off-white': 'cream', 'ivory': 'cream', 'wine': 'burgundy',
  'dark red': 'burgundy', 'maroon': 'maroon', 'mustard': 'yellow',
  'dark brown': 'brown', 'light brown': 'tan', 'chocolate': 'brown',
  'mint': 'green', 'mint green': 'green', 'sage': 'olive', 'sage green': 'olive',
  'baby blue': 'blue', 'sky blue': 'blue', 'royal blue': 'navy',
  'dark green': 'green', 'emerald': 'green', 'lime': 'green',
  'light yellow': 'yellow', 'gold': 'yellow',
  'camel': 'tan', 'khaki': 'olive', 'taupe': 'brown',
  'fuchsia': 'pink', 'magenta': 'pink', 'rose': 'pink',
  'aqua': 'teal', 'turquoise': 'teal', 'cyan': 'teal',
  'lilac': 'lavender', 'purple': 'lavender', 'mauve': 'lavender',
  'silver': 'grey', 'gold': 'yellow', 'bronze': 'brown',
  'denim blue': 'denim', 'light wash denim': 'denim', 'dark denim': 'denim',
}

const FORMALITY_ORDER = ['casual', 'smart_casual', 'business_casual', 'formal', 'black_tie']

const OCCASION_FORMALITY: Record<string, string[]> = {
  'casual': ['casual', 'smart_casual'],
  'work': ['smart_casual', 'business_casual', 'formal'],
  'date': ['smart_casual', 'business_casual', 'formal'],
  'formal': ['formal', 'black_tie'],
  'active': ['casual'],
}

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

// Resolve a colour to its canonical name via aliases, then to the base key
function resolveColour(colour: string): string {
  const normalized = normalizeColour(colour)
  const aliased = COLOUR_ALIASES[normalized]
  return aliased || normalized
}

function areColoursHarmonious(colour1: string, colour2: string): boolean {
  const c1 = resolveColour(colour1)
  const c2 = resolveColour(colour2)

  if (c1 === c2) return true

  const harmonious = COLOUR_HARMONY[c1] || []
  // Fuzzy: check both exact and substring matching
  return harmonious.some(c =>
    c2 === c || c2.includes(c) || c.includes(c2)
  )
}

function hasPatternConflict(patterns: string[]): boolean {
  const nonSolid = patterns.filter(p => p !== 'solid')
  if (nonSolid.length <= 1) return false

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

export function generateValidOutfits(
  items: Item[],
  profile: UserProfile,
  occasion: string,
  skipDirty: boolean = true,
  existingCombinations: Set<string> = new Set(),
) {
  const currentSeason = getCurrentSeason()

  // Filter out archived + dirty items
  let filtered = items.filter(item => {
    if (skipDirty && item.isClean === false) return false
    if (profile.dislikedColours?.length) {
      const itemColour = normalizeColour(item.colour)
      if (profile.dislikedColours.some(d => itemColour.includes(normalizeColour(d)))) return false
    }
    return true
  })

  // Category groups
  const tops = filtered.filter(i => ['t-shirt', 'shirt', 'blouse', 'sweater', 'hoodie'].includes(i.clothingType))
  const bottoms = filtered.filter(i => ['jeans', 'trousers', 'shorts', 'skirt'].includes(i.clothingType))
  const outerwear = filtered.filter(i => ['jacket', 'coat'].includes(i.clothingType))
  const shoes = filtered.filter(i => ['shoes'].includes(i.clothingType))
  const fullBody = filtered.filter(i => ['dress'].includes(i.clothingType))

  // Generate with progressive relaxation
  let outfits = generateCore(tops, bottoms, fullBody, outerwear, shoes, profile, occasion, currentSeason, false)

  // If too few, relax: skip season filter
  if (outfits.length < 5) {
    const allTops = filtered.filter(i => isInFormalityRange(i.formalityLevel, occasion) && ['t-shirt', 'shirt', 'blouse', 'sweater', 'hoodie'].includes(i.clothingType))
    const allBottoms = filtered.filter(i => isInFormalityRange(i.formalityLevel, occasion) && ['jeans', 'trousers', 'shorts', 'skirt'].includes(i.clothingType))
    const allOuterwear = filtered.filter(i => isInFormalityRange(i.formalityLevel, occasion) && ['jacket', 'coat'].includes(i.clothingType))
    const allShoes = filtered.filter(i => isInFormalityRange(i.formalityLevel, occasion) && ['shoes'].includes(i.clothingType))
    const allDresses = filtered.filter(i => isInFormalityRange(i.formalityLevel, occasion) && ['dress'].includes(i.clothingType))

    const relaxed = generateCore(allTops, allBottoms, allDresses, allOuterwear, allShoes, profile, occasion, currentSeason, true)
    outfits.push(...relaxed)
  }

  // If still too few, relax formality too
  if (outfits.length < 5) {
    const anyTops = filtered.filter(i => ['t-shirt', 'shirt', 'blouse', 'sweater', 'hoodie'].includes(i.clothingType))
    const anyBottoms = filtered.filter(i => ['jeans', 'trousers', 'shorts', 'skirt'].includes(i.clothingType))
    const anyOuter = filtered.filter(i => ['jacket', 'coat'].includes(i.clothingType))
    const anyShoes = filtered.filter(i => ['shoes'].includes(i.clothingType))
    const anyDresses = filtered.filter(i => ['dress'].includes(i.clothingType))

    const ultraRelaxed = generateCore(anyTops, anyBottoms, anyDresses, anyOuter, anyShoes, profile, occasion, currentSeason, true)
    outfits.push(...ultraRelaxed)
  }

  // Deduplicate by item IDs + filter out existing combinations
  const seen = new Set<string>()
  const unique = outfits.filter(o => {
    const key = [...o.items].map(i => i.id).sort().join(',')
    if (seen.has(key) || existingCombinations.has(key)) return false
    seen.add(key)
    return true
  })

  return unique
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(o => o.items)
}

function generateCore(
  tops: Item[],
  bottoms: Item[],
  fullBody: Item[],
  outerwear: Item[],
  shoes: Item[],
  profile: UserProfile,
  occasion: string,
  currentSeason: string,
  relaxed: boolean,
): { items: Item[]; score: number }[] {
  const outfits: { items: Item[]; score: number }[] = []

  // Apply season filter unless relaxed
  const topPool = relaxed ? tops : tops.filter(i => matchesSeason(i.season, currentSeason))
  const bottomPool = relaxed ? bottoms : bottoms.filter(i => matchesSeason(i.season, currentSeason))
  const dressPool = relaxed ? fullBody : fullBody.filter(i => matchesSeason(i.season, currentSeason))
  const outerPool = relaxed ? outerwear : outerwear.filter(i => matchesSeason(i.season, currentSeason))
  const shoePool = relaxed ? shoes : shoes.filter(i => matchesSeason(i.season, currentSeason))

  const baseCombinations: Item[][] = []

  for (const top of topPool) {
    for (const bottom of bottomPool) {
      baseCombinations.push([top, bottom])
    }
  }
  for (const dress of dressPool) {
    baseCombinations.push([dress])
  }

  if (baseCombinations.length === 0) return outfits

  for (const base of baseCombinations) {
    const baseColours = base.map(i => resolveColour(i.colour))
    const basePatterns = base.map(i => i.pattern)

    // Colour harmony — strict unless relaxed
    if (!relaxed || baseCombinations.length > 30) {
      let baseHarmonious = true
      for (let i = 0; i < baseColours.length; i++) {
        for (let j = i + 1; j < baseColours.length; j++) {
          if (!areColoursHarmonious(baseColours[i], baseColours[j])) {
            baseHarmonious = false
            break
          }
        }
      }
      if (!baseHarmonious) continue
    }

    if (hasPatternConflict(basePatterns)) continue

    let baseScore = calculateBaseScore(base, profile)

    // Relaxed mode penalty — demote these combos slightly
    if (relaxed) baseScore -= 3

    // ---- PATH 1: Base + shoes ----
    const matchingShoes = shoePool.filter(s => base.every(i => areColoursHarmonious(i.colour, s.colour)))
    if (matchingShoes.length > 0) {
      for (const shoe of matchingShoes.slice(0, 3)) {
        let shoeScore = baseScore + 3 // bonus for completeness
        shoeScore += itemModifier(shoe, profile)
        if (relaxed) shoeScore -= 2
        outfits.push({ items: [...base, shoe], score: shoeScore })
      }
    } else if (shoePool.length > 0) {
      // No colour-match shoe — still offer without colour bonus
      for (const shoe of shoePool.slice(0, 2)) {
        let shoeScore = baseScore + 1 // smaller bonus since colour doesn't match
        shoeScore += itemModifier(shoe, profile)
        if (relaxed) shoeScore -= 2
        outfits.push({ items: [...base, shoe], score: shoeScore })
      }
    }

    // ---- PATH 2: Base + outerwear + shoes ----
    const matchingOuter = outerPool.filter(o => base.every(i => areColoursHarmonious(i.colour, o.colour)))
    for (const ow of matchingOuter.slice(0, 2)) {
      const comboItems = [...base, ow]
      const allColours = [...baseColours, resolveColour(ow.colour)]
      const comboPatterns = [...basePatterns, ow.pattern]

      if (hasPatternConflict(comboPatterns)) continue

      let outerScore = baseScore + 2 // layering bonus
      outerScore += itemModifier(ow, profile)
      if (relaxed) outerScore -= 3

      // Temperature: bonus for outerwear in cold, penalty in hot
      if (profile.currentTemperature !== undefined) {
        if (profile.currentTemperature < 50 && ['coat', 'jacket', 'sweater'].includes(ow.clothingType)) {
          outerScore += 3
        } else if (profile.currentTemperature > 75 && ['coat', 'sweater', 'hoodie'].includes(ow.clothingType)) {
          outerScore -= 3
        }
      }

      const matchingOWshoes = shoePool.filter(s => areColoursHarmonious(s.colour, ow.colour))
      if (matchingOWshoes.length > 0) {
        for (const shoe of matchingOWshoes.slice(0, 2)) {
          let finalScore = outerScore + 2
          finalScore += itemModifier(shoe, profile)
          if (relaxed) finalScore -= 1
          outfits.push({ items: [...comboItems, shoe], score: finalScore })
        }
      }
    }

    // ---- PATH 3: Base only (no shoes, no outerwear) ----
    outfits.push({ items: base, score: baseScore - 2 }) // small penalty for incomplete outfit
  }

  return outfits
}

function calculateBaseScore(base: Item[], profile: UserProfile): number {
  let score = 0

  for (const item of base) {
    score += itemModifier(item, profile)

    // Preferred colours bonus
    if (profile.preferredColours?.length) {
      const itemColour = normalizeColour(item.colour)
      if (profile.preferredColours.some(pc => itemColour.includes(normalizeColour(pc)))) {
        score += 2
      }
    }

    // Wear recency penalty
    if (profile.recentlyWornItemIds?.includes(item.id)) {
      score -= 5
    }
  }

  // Temperature scoring — milder, applied once to the base
  if (profile.currentTemperature !== undefined) {
    const temp = profile.currentTemperature
    for (const item of base) {
      if (temp < 50 && ['coat', 'jacket', 'sweater', 'hoodie'].includes(item.clothingType)) {
        score += 2
      } else if (temp > 75 && ['shorts', 'skirt'].includes(item.clothingType)) {
        score += 2
      } else if (temp > 75 && ['coat', 'sweater', 'hoodie'].includes(item.clothingType)) {
        score -= 2
      }
    }
  }

  // Completeness bonus: outfit with top+bottom scores better than dress alone
  if (base.length >= 2) score += 1

  return score
}

function itemModifier(item: Item, profile: UserProfile): number {
  let mod = 0

  // Condition scoring
  if (item.condition === 'worn' || item.condition === 'needs_repair') {
    mod -= 2
  } else if (item.condition === 'new') {
    mod += 1
  }

  // Highly versatile neutral colours get a small boost
  const neutralColours = ['black', 'white', 'grey', 'navy', 'cream', 'beige', 'tan', 'brown', 'denim']
  if (neutralColours.includes(resolveColour(item.colour))) {
    mod += 1
  }

  // Solid items are more versatile
  if (item.pattern === 'solid') mod += 1

  return mod
}
