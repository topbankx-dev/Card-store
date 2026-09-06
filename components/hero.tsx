'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Gamepad2, Users, MapPin, Clock } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-background to-blue-900/20" />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Jamaican Gaming vibes badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8">
            <span className="text-2xl">🇯🇲</span>
            <span className="text-sm font-medium">Jamaica&apos;s Premier TCG Destination</span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="text-foreground">Trade. Play.</span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent">
              Dominate.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Jamaica&apos;s ultimate destination for Trading Card Games, PC Gaming, and competitive play.
            Yu-Gi-Oh!, Pokémon, Magic: The Gathering, and more.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/shop">
              <Button size="xl" className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Gamepad2 className="w-5 h-5 mr-2" />
                Browse Cards
              </Button>
            </Link>
            <Link href="/events">
              <Button size="xl" variant="outline" className="w-full sm:w-auto">
                <Users className="w-5 h-5 mr-2" />
                View Tournaments
              </Button>
            </Link>
          </div>

          {/* Store features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-card/50 border border-border">
              <MapPin className="w-6 h-6 text-primary flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold">Visit Us</p>
                <p className="text-sm text-muted-foreground">Kingston, Jamaica</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-card/50 border border-border">
              <Clock className="w-6 h-6 text-primary flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold">Store Hours</p>
                <p className="text-sm text-muted-foreground">Tue - Sun: 11am - 9pm</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-card/50 border border-border">
              <Users className="w-6 h-6 text-primary flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold">Weekly Events</p>
                <p className="text-sm text-muted-foreground">Tournaments every week</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}