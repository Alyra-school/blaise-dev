import type { Metadata } from 'next'
import { Inter, Geist } from 'next/font/google'
import './globals.css'
import Layout from '@/components/shared/Layout'
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ['latin'] })

import { headers } from 'next/headers' // added
import ContextProvider from '@/context'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'AppKit Example App',
  description: 'Powered by Reown'
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersObj = await headers()
  const cookies = headersObj.get('cookie')

  return (
    <html lang="en" className={cn("font-sans dark", "font-sans", geist.variable)}>
      <body className={inter.className}>
        <ContextProvider cookies={cookies}>
          <Layout>
            {children}
            <Toaster />
          </Layout>
        </ContextProvider>
      </body>
    </html>
  )
}