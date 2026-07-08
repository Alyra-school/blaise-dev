import { Card, CardContent } from "@/components/ui/card"
import { Wallet } from "lucide-react"

const NotConnected = () => {
  return (
    <div className="container max-w-4xl mx-auto px-4 pt-16">
      <Card className="border border-border/50">
        <CardContent className="flex flex-col items-center justify-center gap-5 py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600/10 ring-1 ring-blue-500/20">
            <Wallet className="h-9 w-9 text-blue-500" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight">Connectez votre wallet</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Utilisez le bouton en haut à droite pour vous connecter et accéder à vos fonds.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default NotConnected
