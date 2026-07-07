'use client';
import { AppKitButton } from '@reown/appkit/react'
import { WalletIcon, EyeIcon, PenLineIcon, RadioIcon } from "lucide-react"

// Petites cartes "feature" purement décoratives, pour présenter la DApp
// avant la connexion du wallet.
const features = [
  {
    icon: EyeIcon,
    title: "Lecture on-chain",
    description: "Consultez la valeur stockée dans le smart contract, sans frais.",
  },
  {
    icon: PenLineIcon,
    title: "Écriture sécurisée",
    description: "Mettez à jour la valeur via une transaction signée par votre wallet.",
  },
  {
    icon: RadioIcon,
    title: "Événements en direct",
    description: "Suivez l'historique complet des modifications émises par le contrat.",
  },
]

const NotConnected = () => {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Icône wallet dans un anneau dégradé */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-500/25 to-violet-600/25 p-px">
        <div className="flex size-14 items-center justify-center rounded-2xl border border-border/60 bg-card">
          <WalletIcon className="size-6 text-primary" />
        </div>
      </div>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
        Stockez un nombre <span className="text-gradient">on-chain</span>
      </h1>
      <p className="mt-3 max-w-md text-balance text-sm text-muted-foreground sm:text-base">
        Connectez votre wallet pour lire et mettre à jour la valeur du smart
        contract SimpleStorage, déployé sur votre réseau Hardhat local.
      </p>

      <div className="mt-8">
        <AppKitButton />
      </div>

      {/* Aperçu des fonctionnalités */}
      <div className="mt-14 grid w-full gap-4 sm:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-border/60 bg-card/60 p-5 text-left"
          >
            <feature.icon className="size-5 text-primary" />
            <h2 className="mt-3 text-sm font-semibold">{feature.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NotConnected
