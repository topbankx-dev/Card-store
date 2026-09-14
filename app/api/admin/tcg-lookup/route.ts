import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'

export const runtime = 'nodejs'

export interface TcgCardResult {
  name: string
  game: 'YGO' | 'POKEMON' | 'MTG' | 'ONE_PIECE' | 'DIGIMON' | 'NARUTO'
  set?: string
  rarity?: string
  price?: number
  image_url?: string
  description?: string
  variant_label?: string
}

const normalizeRarityString = (rarityStr?: string): string => {
  if (!rarityStr) return 'COMMON'
  const upper = rarityStr.toUpperCase()
  if (upper.includes('SECRET') || upper.includes('STARLIGHT') || upper.includes('GHOST') || upper.includes('HYPER') || upper.includes('SPECIAL ART') || upper.includes('SPECIAL ILLUSTRATION')) {
    return 'SECRET_RARE'
  }
  if (upper.includes('MYTHIC')) return 'MYTHIC'
  if (upper.includes('ULTRA') || upper.includes('ULTIMATE') || upper.includes('COLLECTOR') || upper.includes('ILLUSTRATION') || upper.includes('DOUBLE RARE') || upper.includes('VMAX') || upper.includes('VSTAR')) {
    return 'ULTRA_RARE'
  }
  if (upper.includes('SUPER')) return 'SUPER_RARE'
  if (upper.includes('PROMO') || upper.includes('SPECIAL')) return 'PROMO'
  if (upper.includes('UNCOMMON')) return 'UNCOMMON'
  if (upper.includes('RARE') || upper.includes('HOLO')) return 'RARE'
  return 'COMMON'
}

export async function GET(request: NextRequest) {
  try {
    const adminAuth = await requireAdmin()
    if (adminAuth instanceof NextResponse) {
      return adminAuth
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    const game = (searchParams.get('game')?.toUpperCase() || 'YGO') as string

    if (!query) {
      return NextResponse.json({ error: 'Search query required' }, { status: 400 })
    }

    const results: TcgCardResult[] = []

    // 1. Yu-Gi-Oh via YGOPRODeck API (all set printings & alternate art)
    if (game === 'YGO') {
      try {
        const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(query)}`
        const res = await fetch(url, { headers: { Accept: 'application/json' } })

        if (res.ok) {
          const json = await res.json()
          const cards = json.data || []

          for (const card of cards) {
            const cardSets = card.card_sets || []
            const cardImages = card.card_images || []
            const primaryImage = cardImages[0]?.image_url

            if (cardSets.length > 0) {
              // Iterate through all distinct set releases / printings of this card
              for (const set of cardSets) {
                const setPrice = parseFloat(set.set_price || '0')
                const overallPrice = parseFloat(card.card_prices?.[0]?.tcgplayer_price || '0')
                const price = setPrice > 0 ? setPrice : overallPrice > 0 ? overallPrice : 1.00

                results.push({
                  name: card.name,
                  game: 'YGO',
                  set: `${set.set_name} (${set.set_code})`,
                  rarity: normalizeRarityString(set.set_rarity),
                  price,
                  image_url: primaryImage,
                  description: card.desc,
                  variant_label: `${set.set_code} • ${set.set_rarity}`,
                })
              }
            } else {
              // Single entry if no set printings found
              results.push({
                name: card.name,
                game: 'YGO',
                set: undefined,
                rarity: 'COMMON',
                price: parseFloat(card.card_prices?.[0]?.tcgplayer_price || '1.00'),
                image_url: primaryImage,
                description: card.desc,
              })
            }

            // Include alternate artwork variants if present
            if (cardImages.length > 1) {
              for (let i = 1; i < cardImages.length; i++) {
                results.push({
                  name: `${card.name} (Alt Art #${i + 1})`,
                  game: 'YGO',
                  set: 'Alternate Artwork Edition',
                  rarity: 'ULTRA_RARE',
                  price: 5.00,
                  image_url: cardImages[i].image_url,
                  description: card.desc,
                  variant_label: `Alt Art #${i + 1}`,
                })
              }
            }
          }
        }
      } catch (err) {
        console.error('YGOPRODeck lookup error:', err)
      }
    }

    // 2. Magic: The Gathering via Scryfall API (all distinct printings, promos & showcase arts)
    if (game === 'MTG') {
      try {
        const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=prints&order=released`
        const res = await fetch(url, {
          headers: { 'User-Agent': 'CardStoreMVP/1.0', Accept: 'application/json' },
        })

        if (res.ok) {
          const json = await res.json()
          const cards = json.data?.slice(0, 36) || []

          for (const card of cards) {
            const price = parseFloat(card.prices?.usd || card.prices?.usd_foil || '0')
            const image =
              card.image_uris?.normal ||
              card.image_uris?.large ||
              card.card_faces?.[0]?.image_uris?.normal

            results.push({
              name: card.name,
              game: 'MTG',
              set: `${card.set_name} (${card.set?.toUpperCase()} #${card.collector_number || ''})`,
              rarity: normalizeRarityString(card.rarity),
              price: price > 0 ? price : 1.00,
              image_url: image,
              description: card.oracle_text || card.type_line,
              variant_label: `${card.set?.toUpperCase()} #${card.collector_number || ''} • ${card.rarity}`,
            })
          }
        }
      } catch (err) {
        console.error('Scryfall lookup error:', err)
      }
    }

    // 3. Pokémon TCG API (all set printings, secret rares, illustration rares)
    if (game === 'POKEMON') {
      try {
        const url = `https://api.pokemontcg.io/v2/cards?q=name:*${encodeURIComponent(query)}*&pageSize=36&orderBy=-set.releaseDate`
        const res = await fetch(url, { headers: { Accept: 'application/json' } })

        if (res.ok) {
          const json = await res.json()
          const cards = json.data || []

          for (const card of cards) {
            const price =
              card.tcgplayer?.prices?.holofoil?.market ||
              card.tcgplayer?.prices?.normal?.market ||
              card.cardmarket?.prices?.averageSellPrice ||
              1.00

            results.push({
              name: card.name,
              game: 'POKEMON',
              set: card.set?.name
                ? `${card.set.name} (${card.number}/${card.set.total || '?'})`
                : undefined,
              rarity: normalizeRarityString(card.rarity),
              price: parseFloat(price.toString()) || 1.00,
              image_url: card.images?.large || card.images?.small,
              description: card.flavorText || card.subtypes?.join(', '),
              variant_label: `${card.set?.name || 'Promo'} #${card.number} • ${card.rarity || 'Card'}`,
            })
          }
        }
      } catch (err) {
        console.error('Pokemon TCG lookup error:', err)
      }
    }

    return NextResponse.json({ results: results.slice(0, 40) })
  } catch (error) {
    console.error('Error in GET /api/admin/tcg-lookup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

