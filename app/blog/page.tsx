import { Newspaper, Calendar, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const blogPosts = [
  {
    id: 1,
    title: 'YGO Championship Series: Kingston Regional Recap',
    excerpt: 'Highlights from our latest YGO regional tournament with over 60 competitors. Check out the top decks and standout plays.',
    game: 'Yu-Gi-Oh!',
    date: '2026-09-04',
    readTime: '6 min',
    category: 'Tournament',
  },
  {
    id: 2,
    title: 'New Pokemon Set: Stellar Crown — What You Need to Know',
    excerpt: 'Stellar Crown drops this week. Here is our breakdown of the chase cards and what to expect for prices.',
    game: 'Pokemon',
    date: '2026-09-02',
    readTime: '4 min',
    category: 'Set Release',
  },
  {
    id: 3,
    title: 'Building Your First Magic Commander Deck',
    excerpt: 'A beginner-friendly guide to building a Commander deck on a budget. We cover the core pillars and budget staples.',
    game: 'Magic: The Gathering',
    date: '2026-08-28',
    readTime: '8 min',
    category: 'Guide',
  },
  {
    id: 4,
    title: 'One Piece TCG: Meta Snapshot for September',
    excerpt: 'The current One Piece TCG meta and which leaders are dominating the tournament scene right now.',
    game: 'One Piece',
    date: '2026-08-25',
    readTime: '5 min',
    category: 'Meta',
  },
  {
    id: 5,
    title: 'How to Spot Fake TCG Cards: A Buyer\'s Guide',
    excerpt: 'Protect your collection. We walk through the most common signs of counterfeit cards across YGO, Pokemon, and MTG.',
    game: 'General',
    date: '2026-08-20',
    readTime: '7 min',
    category: 'Education',
  },
  {
    id: 6,
    title: 'In-Store League Play: Prizes and Promos for September',
    excerpt: 'Earn exclusive promos and store credit by participating in our weekly league play. Full schedule inside.',
    game: 'Multi-Game',
    date: '2026-08-15',
    readTime: '3 min',
    category: 'Events',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-background">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Newspaper className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium text-primary">The Hub Blog</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              TCG News, Guides & Tournament Reports
            </h1>
            <p className="text-lg text-muted-foreground">
              Stay current with set releases, meta shifts, and how-tos from Jamaica's home for trading card games.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <Card key={post.id} className="flex flex-col hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">{post.category}</Badge>
                  <span className="text-xs text-muted-foreground">{post.game}</span>
                </div>
                <CardTitle className="text-xl leading-tight">{post.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-xs">
                  <Calendar className="w-3 h-3" />
                  {new Date(post.date).toLocaleDateString('en-JM', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  <span>·</span>
                  <span>{post.readTime} read</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <p className="text-sm text-muted-foreground mb-4">{post.excerpt}</p>
                <Button variant="ghost" className="w-fit p-0 h-auto hover:bg-transparent">
                  Read more
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
