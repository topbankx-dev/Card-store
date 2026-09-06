import Link from 'next/link'
import { Gamepad2, Instagram, Facebook, Twitter, Mail, MapPin, Phone } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-card/30 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Gamepad2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">Jamaica TCG Hub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Jamaica&apos;s premier destination for Trading Card Games, PC Gaming, and competitive play.
            </p>
            <div className="flex gap-2">
              <Link
                href="#"
                className="w-9 h-9 rounded-md bg-muted hover:bg-primary/20 flex items-center justify-center transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </Link>
              <Link
                href="#"
                className="w-9 h-9 rounded-md bg-muted hover:bg-primary/20 flex items-center justify-center transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </Link>
              <Link
                href="#"
                className="w-9 h-9 rounded-md bg-muted hover:bg-primary/20 flex items-center justify-center transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/shop?game=YGO" className="hover:text-primary">Yu-Gi-Oh!</Link></li>
              <li><Link href="/shop?game=POKEMON" className="hover:text-primary">Pokémon</Link></li>
              <li><Link href="/shop?game=MTG" className="hover:text-primary">Magic: The Gathering</Link></li>
              <li><Link href="/shop?game=ONE_PIECE" className="hover:text-primary">One Piece</Link></li>
              <li><Link href="/shop?sealed=true" className="hover:text-primary">Sealed Products</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-semibold mb-4">Community</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/events" className="hover:text-primary">Tournaments</Link></li>
              <li><Link href="/pc-gaming" className="hover:text-primary">PC Gaming</Link></li>
              <li><Link href="/about" className="hover:text-primary">About Us</Link></li>
              <li><Link href="#" className="hover:text-primary">Discord</Link></li>
              <li><Link href="#" className="hover:text-primary">WhatsApp</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Kingston, Jamaica</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>+1 (876) 555-CARD</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>hello@tcghub.jm</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2024 Jamaica TCG Hub. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-primary">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}