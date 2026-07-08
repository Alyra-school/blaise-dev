import { formatEther } from "viem"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

const Balance = ({ balance, isPending }: { balance: bigint, isPending: boolean }) => {
  return (
    <Card className="border-0 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg overflow-hidden">
      <CardContent className="py-6 px-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-100 mb-1">Votre solde</p>
            {Number(formatEther(balance)).toFixed(9)}
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 shrink-0">
            <TrendingUp className="h-7 w-7 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default Balance
