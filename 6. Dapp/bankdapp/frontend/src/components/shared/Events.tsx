import { BankEvent } from "@/types/bank"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatEther } from "viem"
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react"

const Events = ({ events }: { events: BankEvent[] }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Historique des transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {events.map((event, index) => (
            <div
              key={`${event.blockNumber}-${index}`}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-accent/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                {event.type === 'Deposit' ? (
                  <ArrowDownCircle className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <ArrowUpCircle className="h-4 w-4 text-orange-500 shrink-0" />
                )}
                <div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {event.account.slice(0, 6)}...{event.account.slice(-4)}
                  </span>
                  <p className="text-xs text-muted-foreground/60">Block #{event.blockNumber}</p>
                </div>
              </div>
              <span className={`text-sm font-semibold tabular-nums ${event.type === 'Deposit' ? 'text-green-500' : 'text-orange-500'}`}>
                {event.type === 'Deposit' ? '+' : '-'}{formatEther(event.amount)} ETH
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default Events
