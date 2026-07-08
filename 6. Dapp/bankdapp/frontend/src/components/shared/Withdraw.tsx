'use client'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpCircle, CheckCircle2, XCircle, Loader2, Clock } from "lucide-react"

import { type BaseError, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from "viem"
import { useState, useEffect } from "react"
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/index"

const Withdraw = ({ refetch, getEvents }: { refetch: () => void, getEvents: () => void }) => {
  const [withdrawAmount, setWithdrawAmount] = useState('')

  const { data: hash, error, isPending, writeContract } = useWriteContract()

  const withdraw = async () => {
    if (!withdrawAmount || Number(withdrawAmount) <= 0) return
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'withdraw',
      args: [parseEther(withdrawAmount)]
    })
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed, error: errorConfirmation } =
    useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isConfirmed) {
      refetch()
      setWithdrawAmount('')
      setTimeout(() => getEvents(), 2000)
    }
  }, [isConfirmed])

  const status = (() => {
    if (error || errorConfirmation) return {
      icon: <XCircle className="h-4 w-4 shrink-0" />,
      msg: ((error || errorConfirmation) as BaseError).shortMessage || (error || errorConfirmation)!.message,
      cls: 'bg-red-500/10 text-red-400 border-red-500/20'
    }
    if (isConfirmed) return {
      icon: <CheckCircle2 className="h-4 w-4 shrink-0" />,
      msg: 'Transaction confirmée',
      cls: 'bg-green-500/10 text-green-400 border-green-500/20'
    }
    if (isConfirming) return {
      icon: <Loader2 className="h-4 w-4 shrink-0 animate-spin" />,
      msg: 'Confirmation en cours...',
      cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    }
    if (hash) return {
      icon: <Clock className="h-4 w-4 shrink-0" />,
      msg: `Tx: ${hash.slice(0, 8)}...${hash.slice(-6)}`,
      cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    }
    return null
  })()

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowUpCircle className="h-5 w-5 text-orange-500" />
          Retirer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {status && (
          <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium ${status.cls}`}>
            {status.icon}
            <span className="truncate">{status.msg}</span>
          </div>
        )}
        <div className="relative">
          <Input
            type="number"
            placeholder="Montant en ETH"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            min="0"
            step="0.000000000000000001"
            className="pr-12"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">ETH</span>
        </div>
        <Button
          variant="outline"
          className="w-full border-orange-500/40 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
          disabled={isPending || !withdrawAmount || Number(withdrawAmount) <= 0}
          onClick={withdraw}
        >
          {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Retrait...</> : 'Retirer'}
        </Button>
      </CardContent>
    </Card>
  )
}

export default Withdraw
