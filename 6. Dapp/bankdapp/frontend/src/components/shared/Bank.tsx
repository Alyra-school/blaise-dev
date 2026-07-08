'use client';
import Deposit from "@/components/shared/Deposit";
import Withdraw from "@/components/shared/Withdraw";
import Balance from "@/components/shared/Balance";
import Events from "@/components/shared/Events";

import { useReadContract, useConnection } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/index";
import { useState, useEffect } from "react";
import { publicClient } from "@/lib/client";
import { parseAbiItem } from "viem";
import { BankEvent } from "@/types/bank";
import { Loader2 } from "lucide-react";

export default function Bank() {
  const { address, isConnected } = useConnection()
  const [events, setEvents] = useState<BankEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false);

  const { data: balance, isPending, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getBalanceOfUser',
    args: [address],
  })

  const getEvents = async () => {
    setLoadingEvents(true);
    try {
      
      const depositEvents = await publicClient.getLogs({
        address: CONTRACT_ADDRESS,
        event: parseAbiItem('event etherDeposited(address indexed account, uint256 amount)'),
        fromBlock: 11229677n,
        toBlock: 'latest'
      });
      const withdrawEvents = await publicClient.getLogs({
        address: CONTRACT_ADDRESS,
        event: parseAbiItem('event etherWithdrawn(address indexed account, uint256 amount)'),
        fromBlock: 11229677n,
        toBlock: 'latest'
      });
      // On fusionne les deux tableaux d'événements (dépôts + retraits) en un seul.
      // Le type BankEvent permet de typer chaque entrée avec 'Deposit' ou 'Withdraw'.
      const combined: BankEvent[] = [
        // Pour chaque événement de dépôt récupéré depuis la blockchain...
        ...depositEvents.map((e) => ({
          type: 'Deposit' as const,         // 'as const' force le type littéral 'Deposit' (pas juste string)
          account: e.args.account?.toString() || '', // adresse du déposant (?.toString() gère le cas undefined)
          amount: e.args.amount || 0n,      // montant en wei (bigint), 0n par défaut si absent
          blockNumber: Number(e.blockNumber) // numéro du bloc converti en number pour le tri
        })),
        // Même traitement pour les événements de retrait
        ...withdrawEvents.map((e) => ({
          type: 'Withdraw' as const,
          account: e.args.account?.toString() || '',
          amount: e.args.amount || 0n,
          blockNumber: Number(e.blockNumber)
        }))
      ];
      
      setEvents(combined.sort((a, b) => b.blockNumber - a.blockNumber));
    } catch {
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }

  useEffect(() => {
    if (isConnected) getEvents();
  }, [isConnected]);

  return (
    <div className="container max-w-4xl mx-auto px-4 space-y-4">
      <Balance balance={typeof balance === 'bigint' ? balance : 0n} isPending={isPending} />

      <div className="grid md:grid-cols-2 gap-4">
        <Deposit refetch={refetch} getEvents={getEvents} />
        <Withdraw refetch={refetch} getEvents={getEvents} />
      </div>

      {loadingEvents ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement des transactions...
        </div>
      ) : events.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">
          Aucune transaction à afficher.
        </p>
      ) : (
        <Events events={events} />
      )}
    </div>
  );
}
