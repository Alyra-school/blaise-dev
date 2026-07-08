import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

// publicClient ne sert qu'à récupérer les events (eth_getLogs sur une large plage de blocs).
// Le free tier d'Alchemy limite eth_getLogs à 10 blocs → on utilise un RPC public
// qui autorise les plages larges. Alchemy (config/index.tsx, via wagmi) reste utilisé
// pour le solde, les lectures de contrat et les transactions, où le free tier suffit.
export const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL)
})
