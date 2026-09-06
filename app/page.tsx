import { Hero } from '@/components/hero'
import { TournamentSchedule } from '@/components/tournament-schedule'
import { FeaturedSingles } from '@/components/featured-singles'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartSidebar } from '@/components/cart-sidebar'

export default function Home() {
  return (
    <>
      <Header />
      <CartSidebar />
      <main className="flex flex-col min-h-screen">
        <Hero />
        <TournamentSchedule />
        <FeaturedSingles />
      </main>
      <Footer />
    </>
  )
  
}