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

// Known Yu-Gi-Oh image ID to artwork descriptions
const YGO_ART_LABELS: Record<string, string> = {
  // Blue-Eyes White Dragon
  '89631139': 'Original Anime / LOB Art',
  '89631140': 'Tablet / CT13 / MP22 Art',
  '89631141': 'Earth & Space Background Art',
  '89631142': 'Jump Festa Promo Art',
  '89631143': 'Kazuki Takahashi 10th Anniv Art',
  '89631144': 'DSOD Movie / CT14 Art',
  '89631145': 'Maximum Gold Alternate Art',
  '89631146': '25th Anniversary Signature Art',
  // Dark Magician
  '46986414': 'Original Anime / LOB Art',
  '46986415': 'Tablet / CT13 Art',
  '46986416': 'Arkana Red Robes Art',
  '46986417': 'Jump Festa Promo Art',
  '46986418': 'Kazuki Takahashi 10th Anniv Art',
  '46986419': 'DSOD Movie Art',
  '46986420': 'Maximum Gold Alternate Art',
  '46986421': '25th Anniversary Signature Art',
  // Ash Blossom
  '14558127': 'Original Artwork',
  '14558128': 'Alternate Artwork (DUDE / MAGO)',
  // Red-Eyes
  '74677422': 'Original Anime Art',
  '74677423': 'Tablet Art',
  '74677424': 'Anniversary Art',
  '74677425': 'Maximum Gold Art',
  // I:P Masquerena
  '65741786': 'Original Helmet Art',
  '65741787': 'Alternate Driving Art (MGED/RA01)',
  // Kagari
  '8508055': 'Original Armor Art',
  '8508056': 'Alternate Mech Art (DUOV/RA01)',
  // Apollousa
  '4280258': 'Original Art',
  '4280259': 'Alternate Art (MAGO/RA01)',
}

// Function to map set codes to their exact artwork image
function getYgoImageForSet(card: any, setCode: string): string {
  const images = card.card_images || []
  if (!images.length) return ''
  if (images.length === 1) return images[0].image_url

  const code = (setCode || '').toUpperCase()
  const name = (card.name || '').toLowerCase()

  // Ash Blossom / Handtraps
  if (code.includes('DUDE') || code.includes('MAGO') || code.includes('MGED')) {
    if (images.length > 1) return images[1].image_url
  }

  // Blue-Eyes White Dragon
  if (name.includes('blue-eyes white dragon')) {
    if (code.includes('MVP1') || code.includes('CT14')) return images[5]?.image_url || images[1]?.image_url
    if (code.includes('CT13') || code.includes('MP22') || code.includes('MP24') || code.includes('SDBE') || code.includes('DPKB')) return images[1]?.image_url || images[0].image_url
    if (code.includes('YAP1') || code.includes('10TH')) return images[4]?.image_url || images[0].image_url
    if (code.includes('JMP') || code.includes('JMPS')) return images[3]?.image_url || images[0].image_url
    if (code.includes('FL1') || code.includes('SKE')) return images[2]?.image_url || images[0].image_url
    if (code.includes('MAGO') || code.includes('PGLD')) return images[6]?.image_url || images[0].image_url
    if (code.includes('KC01') || code.includes('25TH')) return images[7]?.image_url || images[1]?.image_url
    if (code.includes('LOB') || code.includes('LC01') || code.includes('YSKR') || code.includes('SDK')) return images[0].image_url
  }

  // Dark Magician
  if (name.includes('dark magician') && !name.includes('girl')) {
    if (code.includes('CT13') || code.includes('CT14') || code.includes('MVP1')) return images[5]?.image_url || images[1]?.image_url
    if (code.includes('YAP1')) return images[4]?.image_url || images[0].image_url
    if (code.includes('JMP')) return images[3]?.image_url || images[0].image_url
    if (code.includes('SY2') || code.includes('PCY') || code.includes('FL1')) return images[1]?.image_url || images[0].image_url
    if (code.includes('MAGO')) return images[6]?.image_url || images[0].image_url
    if (code.includes('25TH') || code.includes('KC01')) return images[7]?.image_url || images[1]?.image_url
    if (code.includes('SDY') || code.includes('LOB')) return images[0].image_url
  }

  // Dark Magician Girl
  if (name.includes('dark magician girl')) {
    if (code.includes('MVP1') || code.includes('CT14')) return images[2]?.image_url || images[1]?.image_url || images[0].image_url
    if (code.includes('MAGO') || code.includes('MGED')) return images[images.length - 1]?.image_url || images[0].image_url
    if (code.includes('YAP1')) return images[1]?.image_url || images[0].image_url
  }

  // Red-Eyes Black Dragon
  if (name.includes('red-eyes black dragon')) {
    if (code.includes('YAP1')) return images[2]?.image_url || images[0].image_url
    if (code.includes('MAGO')) return images[3]?.image_url || images[0].image_url
    if (code.includes('CT14') || code.includes('LDK2')) return images[1]?.image_url || images[0].image_url
  }

  // I:P Masquerena
  if (name.includes('masquerena') && images.length > 1) {
    if (code.includes('MGED') || code.includes('MAGO') || code.includes('MP22') || code.includes('RA01')) return images[1].image_url
  }

  // Sky Striker Ace - Kagari / Shizuku
  if (name.includes('kagari') || name.includes('shizuku')) {
    if ((code.includes('DUOV') || code.includes('MAGO') || code.includes('RA01')) && images.length > 1) return images[1].image_url
  }

  // Knightmare Unicorn / Phoenix
  if (name.includes('knightmare') && images.length > 1) {
    if (code.includes('GEIM') || code.includes('MAGO') || code.includes('RA01')) return images[1].image_url
  }

  // Apollousa
  if (name.includes('apollousa') && images.length > 1) {
    if (code.includes('MAGO') || code.includes('RA01')) return images[1].image_url
  }

  // Eldlich
  if (name.includes('eldlich') && images.length > 1) {
    if (code.includes('MGED') || code.includes('MAGO') || code.includes('RA01')) return images[1].image_url
  }

  return images[0].image_url
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

    // 1. Yu-Gi-Oh via YGOPRODeck API
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

            // A. If the card has multiple distinct artworks, list each distinct artwork illustration first!
            if (cardImages.length > 1) {
              for (let i = 0; i < cardImages.length; i++) {
                const img = cardImages[i]
                const artLabel = YGO_ART_LABELS[String(img.id)] || `Artwork Version #${i + 1}`

                results.push({
                  name: card.name,
                  game: 'YGO',
                  set: `Artwork: ${artLabel}`,
                  rarity: i === 0 ? 'ULTRA_RARE' : 'SECRET_RARE',
                  price: parseFloat(card.card_prices?.[0]?.tcgplayer_price || '5.00'),
                  image_url: img.image_url,
                  description: card.desc,
                  variant_label: `🎨 ${artLabel}`,
                })
              }
            }

            // B. Add all specific set releases with their matched artwork photo
            if (cardSets.length > 0) {
              for (const set of cardSets) {
                const setPrice = parseFloat(set.set_price || '0')
                const overallPrice = parseFloat(card.card_prices?.[0]?.tcgplayer_price || '0')
                const price = setPrice > 0 ? setPrice : overallPrice > 0 ? overallPrice : 1.00
                const matchedImage = getYgoImageForSet(card, set.set_code)

                results.push({
                  name: card.name,
                  game: 'YGO',
                  set: `${set.set_name} (${set.set_code})`,
                  rarity: normalizeRarityString(set.set_rarity),
                  price,
                  image_url: matchedImage,
                  description: card.desc,
                  variant_label: `${set.set_code} • ${set.set_rarity}`,
                })
              }
            } else if (cardImages.length <= 1) {
              // Single entry if no set printings found and single image
              results.push({
                name: card.name,
                game: 'YGO',
                set: undefined,
                rarity: 'COMMON',
                price: parseFloat(card.card_prices?.[0]?.tcgplayer_price || '1.00'),
                image_url: cardImages[0]?.image_url,
                description: card.desc,
              })
            }
          }
        }
      } catch (err) {
        console.error('YGOPRODeck lookup error:', err)
      }
    }

    // 2. Magic: The Gathering via Scryfall API (exact 1:1 scan for every printing)
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

    // 3. Pokémon TCG API (exact 1:1 scan for every printing & rarity)
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

    return NextResponse.json({ results: results.slice(0, 48) })
  } catch (error) {
    console.error('Error in GET /api/admin/tcg-lookup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


