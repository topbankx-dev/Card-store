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

    // Yu-Gi-Oh via YGOPRODeck API
    if (game === 'YGO') {
      try {
        const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(query)}`
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
        if (res.ok) {
          const json = await res.json()
          const cards = json.data?.slice(0, 8) || []
          for (const card of cards) {
            const firstSet = card.card_sets?.[0]
            const price = parseFloat(card.card_prices?.[0]?.tcgplayer_price || '0')
            results.push({
              name: card.name,
              game: 'YGO',
              set: firstSet ? `${firstSet.set_name} (${firstSet.set_code})` : undefined,
              rarity: firstSet?.set_rarity?.toUpperCase().replace(/\s+/g, '_') || 'COMMON',
              price: price > 0 ? price : 1.00,
              image_url: card.card_images?.[0]?.image_url,
              description: card.desc,
            })
          }
        }
      } catch (err) {
        console.error('YGOPRODeck lookup error:', err)
      }
    }

    // MTG via Scryfall API
    if (game === 'MTG') {
      try {
        const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=cards`
        const res = await fetch(url, { headers: { 'User-Agent': 'CardStoreMVP/1.0', 'Accept': 'application/json' } })
        if (res.ok) {
          const json = await res.json()
          const cards = json.data?.slice(0, 8) || []
          for (const card of cards) {
            const price = parseFloat(card.prices?.usd || card.prices?.usd_foil || '0')
            results.push({
              name: card.name,
              game: 'MTG',
              set: `${card.set_name} (${card.collector_number || ''})`,
              rarity: card.rarity?.toUpperCase() || 'COMMON',
              price: price > 0 ? price : 1.00,
              image_url: card.image_uris?.normal || card.image_uris?.png,
              description: card.oracle_text || card.type_line,
            })
          }
        }
      } catch (err) {
        console.error('Scryfall lookup error:', err)
      }
    }

    // Pokémon TCG API
    if (game === 'POKEMON') {
      try {
        const url = `https://api.pokemontcg.io/v2/cards?q=name:"*${encodeURIComponent(query)}*"&pageSize=8`
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
        if (res.ok) {
          const json = await res.json()
          const cards = json.data || []
          for (const card of cards) {
            const price = card.tcgplayer?.prices?.holofoil?.market || card.tcgplayer?.prices?.normal?.market || card.cardmarket?.prices?.averageSellPrice || 1.00
            results.push({
              name: card.name,
              game: 'POKEMON',
              set: card.set?.name ? `${card.set.name} (${card.number}/${card.set.total})` : undefined,
              rarity: card.rarity?.toUpperCase().replace(/\s+/g, '_') || 'RARE',
              price: parseFloat(price.toString()) || 1.00,
              image_url: card.images?.large || card.images?.small,
              description: card.flavorText || card.subtypes?.join(', '),
            })
          }
        }
      } catch (err) {
        console.error('Pokemon TCG lookup error:', err)
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Error in GET /api/admin/tcg-lookup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
