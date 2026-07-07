'use client';
import { AppKitButton } from '@reown/appkit/react'
import { DatabaseZapIcon } from 'lucide-react'

export default function Header() {
    return (
        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
                {/* Logo + nom de l'application */}
                <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
                        <DatabaseZapIcon className="size-4.5 text-white" />
                    </div>
                    <div className="flex flex-col leading-tight">
                        <span className="text-sm font-semibold tracking-tight">SimpleStorage</span>
                        <span className="text-[11px] text-muted-foreground">Hardhat · réseau local</span>
                    </div>
                </div>

                {/* Bouton de connexion wallet (Reown AppKit) */}
                <AppKitButton />
            </div>
        </header>
    )
}
