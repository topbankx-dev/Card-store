import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { Providers } from '@/components/providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Jamaica TCG Store & PC Gaming Lounge',
  description: 'Trading Card Game store and PC Gaming Lounge in Jamaica - Yu-Gi-Oh!, Pokemon, Magic, and more.',
  keywords: 'TCG, Trading Card Games, Yu-Gi-Oh, Pokemon, Magic, Jamaica, PC Gaming, Trading Cards',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('card-store-theme');
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else {
                    // Default to dark if nothing stored yet
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`min-h-screen bg-background text-foreground ${inter.variable} font-sans`}>
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}