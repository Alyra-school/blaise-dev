import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Header from '@/components/shared/Header'
import { Toaster } from "@/components/ui/sonner"

import { headers } from 'next/headers' // added
import ContextProvider from '@/context'
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: 'SimpleStorage · DApp',
  description: 'Stockez un nombre on-chain — démo Web3 propulsée par wagmi, viem et Reown AppKit.'
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersObj = await headers()
  const cookies = headersObj.get('cookie')

  return (
    <html lang="fr" className={cn("dark font-sans", geist.variable, geistMono.variable)}>
      <body className="flex min-h-dvh flex-col antialiased">
        <ContextProvider cookies={cookies}>
          <Header />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6">
            {children}
          </main>
          <footer className="border-t border-border/60 py-6">
            <p className="mx-auto w-full max-w-5xl px-4 text-xs text-muted-foreground sm:px-6">
              SimpleStorage — démo Web3 · wagmi · viem · Reown AppKit
            </p>
          </footer>
          <Toaster />
        </ContextProvider>
      </body>
    </html>
  )
}
