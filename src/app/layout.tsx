import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Navbar } from '@/components/navigation/Navbar'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  fallback: ['system-ui', 'arial'],
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'Polkadot Dashboard',
  description: 'Your gateway to the Polkadot ecosystem',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Add CSRF token meta tag */}
        <meta name="csrf-token" content={process.env.NEXT_PUBLIC_CSRF_TOKEN} />
      </head>
      <body className={`${inter.className} antialiased bg-gray-50 min-h-screen flex flex-col`}>
        <Providers>
          <Navbar />
          <div className="flex-grow">
            {children}
          </div>
          <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
              <div className="text-center text-sm text-gray-500">
                © {new Date().getFullYear()} Polkadot Dashboard. Built with ❤️ for the Polkadot community.
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  )
} 