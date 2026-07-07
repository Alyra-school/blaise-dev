// 'use client' indique à Next.js (App Router) que ce composant est un Client Component :
// il s'exécute dans le navigateur et peut donc utiliser les hooks React (useState, useEffect)
// ainsi que les hooks wagmi qui ont besoin du wallet de l'utilisateur (MetaMask...).
// Sans cette directive, le composant serait rendu côté serveur et planterait.
'use client'

// --- Hooks wagmi : la "boîte à outils" pour parler à la blockchain ---
// useReadContract          -> LIRE une donnée du contrat (gratuit, aucune transaction)
// useWriteContract         -> ÉCRIRE dans le contrat (transaction signée + payante en gas)
// useWaitForTransactionReceipt -> ATTENDRE qu'une transaction soit minée/confirmée
// type BaseError           -> le type d'erreur commun à wagmi/viem (pour afficher un message propre)
import { useReadContract, type BaseError, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'

// L'adresse du contrat déployé + son ABI (la "notice" qui décrit ses fonctions/events/erreurs).
// wagmi a besoin des deux pour savoir QUOI appeler et OÙ.
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config'

// Les hooks React de base : useState (mémoire locale du composant) et useEffect (effets de bord).
import { useState, useEffect } from 'react'

// Le type TypeScript qui décrit la forme d'un événement une fois "nettoyé" ({ by, number }).
import { SimpleStorageEvent } from '@/types'

// Un client viem "public" (lecture seule, sans wallet) qu'on utilise pour lire les logs/events.
import { publicClient } from '@/lib/client'

// parseAbiItem transforme une signature d'event écrite en texte
// ("event NumberChanged(...)") en objet ABI exploitable par viem.
import { parseAbiItem } from 'viem'

// Le composant enfant qui affiche la liste des events.
import Events from './Events'

// ShadcnUI Components
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Icônes (affichage uniquement)
import {
    DatabaseIcon,
    Loader2Icon,
    CircleCheckIcon,
    OctagonXIcon,
    TriangleAlertIcon,
    PenLineIcon,
    ArrowRightIcon,
    FileCodeIcon,
} from "lucide-react"

import { toast } from "sonner"

// Utilitaire d'affichage : tronque adresses et hashs (0x1234…abcd).
import { formatAddress } from '@/lib/utils'

// Constante partagée : elle DOIT refléter la règle du smart contract -> require(_myNumber < 10).
// On la met à part pour n'avoir qu'un seul endroit à changer si la règle du contrat évolue.
const MAX_NUMBER = 10;

const SimpleStorage = () => {

    // === 1. STATE LOCAL (la mémoire du composant) ===================================

    // inputNumber : ce que l'utilisateur tape dans le champ. Toujours une chaîne ("15"),
    // car la valeur d'un <input> HTML est toujours du texte.
    const [inputNumber, setInputNumber] = useState("");

    // events : la liste des événements NumberChanged récupérés depuis la blockchain.
    // On la typpe explicitement en tableau de SimpleStorageEvent, initialisé vide [].
    const [events, setEvents] = useState<SimpleStorageEvent[]>([]);

    // === 2. ÉCRITURE DANS LE CONTRAT ================================================

    // useWriteContract nous donne :
    //  - hash            : le hash de la transaction une fois envoyée (undefined avant)
    //  - errorWrite      : une éventuelle erreur d'envoi (rejet dans MetaMask, revert...)
    //  - isPendingWrite  : true tant que l'utilisateur n'a pas validé dans son wallet
    //  - writeContract   : LA fonction à appeler pour déclencher l'écriture
    const { data: hash, error: errorWrite, isPending: isPendingWrite, writeContract } = useWriteContract();

    // === 3. LECTURE DU CONTRAT ======================================================

    // useReadContract lit getMyNumber() au chargement, puis à chaque fois qu'on appelle refetch().
    //  - myNumberFromContract : la valeur lue (un bigint)
    //  - errorRead            : erreur de lecture éventuelle
    //  - isPendingRead        : true pendant le tout premier chargement
    //  - refetch              : fonction pour relire la valeur à la demande (après une écriture)
    const { data: myNumberFromContract, error: errorRead, isPending: isPendingRead, refetch } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getMyNumber',
    });

    // === 4. VALIDATION CÔTÉ FRONT (UX) =============================================

    // On vérifie la règle AVANT d'envoyer la transaction, uniquement pour le confort utilisateur :
    // feedback immédiat + on n'envoie jamais une transaction qui va forcément échouer (revert).
    // ⚠️ Ce n'est PAS de la sécurité : n'importe qui peut appeler le contrat directement.
    // La vraie garantie reste le require() côté smart contract.
    // isInvalid vaut true seulement si un nombre est saisi ET qu'il dépasse la limite.
    const isInvalid = inputNumber !== "" && Number(inputNumber) >= MAX_NUMBER;

    // Fonction appelée au clic sur "Valider".
    const handleSubmitNumber = () => {
        // Garde-fou : on ne fait rien si le champ est vide ou si la valeur est invalide.
        if (inputNumber === "" || isInvalid) return;

        // On déclenche l'écriture. writeContract ouvre le wallet pour que l'utilisateur signe.
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'setMyNumber',
            // La fonction attend un uint256 : on convertit la chaîne en BigInt (ex: "5" -> 5n).
            args: [BigInt(inputNumber)],
        });
    }

    // === 5. SUIVI DE LA CONFIRMATION DE LA TRANSACTION ==============================

    // Une fois la transaction envoyée (on a un hash), on attend qu'elle soit minée.
    //  - isConfirming : true pendant que la transaction est en attente dans un bloc
    //  - isConfirmed  : true une fois la transaction confirmée avec succès
    const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

    // === 6. RÉCUPÉRATION DES EVENTS ================================================

    // getEvents lit tous les logs "NumberChanged" émis par le contrat depuis le bloc 0.
    // C'est de la lecture pure : on passe par le publicClient (pas besoin de wallet).
    const getEvents = async() => {
        const numberChangedEvents = await publicClient.getLogs({
            address: CONTRACT_ADDRESS,
            // On décrit l'event à écouter à partir de sa signature Solidity.
            event: parseAbiItem('event NumberChanged(address indexed by, uint256 number)'),
            fromBlock: 0n,        // depuis le tout premier bloc
            toBlock: 'latest'     // jusqu'au bloc le plus récent
        })

        // On transforme les logs bruts de viem en objets simples et lisibles pour l'affichage.
        setEvents(numberChangedEvents.map((event) => {
            return {
                by: event.args.by as string,
                // number est un bigint : on le convertit en texte. Si absent, chaîne vide.
                number: event.args.number?.toString() || ''
            }
        }))
    }

    // === 7. EFFETS (useEffect) =====================================================

    // Cet effet se déclenche à chaque changement de isConfirmed.
    // Quand une transaction vient d'être confirmée :
    //  - refetch()          -> on relit la nouvelle valeur du contrat
    //  - getEvents()        -> on recharge la liste des events (un nouveau vient d'être émis)
    //  - setInputNumber("") -> on vide le champ de saisie
    useEffect(() => {
        if(isConfirmed) {
            refetch();
            getEvents();
            setInputNumber("");
            toast.success("La valeur a bien été mise à jour !")
        }
    }, [isConfirmed])

    // Cet effet avec un tableau de dépendances vide [] ne s'exécute qu'UNE fois,
    // au montage du composant : on charge les events existants dès l'affichage de la page.
    useEffect(() => {
        getEvents();
    }, [])

    // === 8. RENDU CONDITIONNEL (early returns) =====================================

    // Tant que la toute première lecture n'est pas terminée, on affiche un état de chargement.
    if (isPendingRead) return (
        <div className="flex flex-col items-center justify-center gap-3 py-24">
            <Loader2Icon className="size-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Lecture du contrat…</p>
        </div>
    )

    // Si la lecture a échoué, on affiche le message d'erreur le plus clair possible :
    // shortMessage (court et lisible) sinon message (plus technique) en repli.
    if (errorRead)
    return (
      <Alert variant="destructive" className="border-destructive/30">
        <OctagonXIcon />
        <AlertTitle>Impossible de lire le contrat</AlertTitle>
        <AlertDescription>
          {(errorRead as unknown as BaseError).shortMessage || errorRead.message}
        </AlertDescription>
      </Alert>
    )

    // === 9. RENDU PRINCIPAL ========================================================

    return (
        <div className="flex flex-col gap-6">

            {/* En-tête de page */}
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Lisez et mettez à jour la valeur stockée dans le smart contract.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-5">

                {/* --- Carte : valeur actuelle du contrat --------------------------------- */}
                <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 lg:col-span-2">
                    {/* Halo décoratif dans le coin de la carte */}
                    <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-primary/15 blur-3xl" />

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DatabaseIcon className="size-4" />
                        Valeur stockée
                    </div>

                    {/* Affichage de la valeur actuelle stockée dans le contrat (bigint -> texte). */}
                    <p className="text-gradient mt-5 text-7xl font-semibold tracking-tight tabular-nums">
                        {myNumberFromContract?.toString()}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                        sur un maximum autorisé de {MAX_NUMBER - 1}
                    </p>

                    {/* Adresse du contrat, tronquée, avec la valeur complète au survol */}
                    <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1.5">
                        <FileCodeIcon className="size-3.5 text-muted-foreground" />
                        <span className="font-mono text-xs text-muted-foreground" title={CONTRACT_ADDRESS}>
                            {formatAddress(CONTRACT_ADDRESS)}
                        </span>
                    </div>
                </section>

                {/* --- Carte : formulaire de mise à jour ----------------------------------- */}
                <section className="rounded-2xl border border-border/60 bg-card p-6 lg:col-span-3">
                    <div className="flex items-center gap-2">
                        <PenLineIcon className="size-4 text-primary" />
                        <h2 className="text-sm font-semibold">Mettre à jour la valeur</h2>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Choisissez un entier entre 0 et {MAX_NUMBER - 1}, puis signez la transaction dans votre wallet.
                    </p>

                    <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                        {/*
                          Input "contrôlé" : sa valeur affichée vient du state (value={inputNumber})
                          et chaque frappe met à jour le state (onChange). React est la source de vérité.
                          min/step aident l'utilisateur à saisir un entier positif (cohérent avec uint256).
                        */}
                        <Input
                            type="number"
                            min={0}
                            step={1}
                            placeholder={`Ex. ${MAX_NUMBER - 3}`}
                            value={inputNumber}
                            onChange={(e) => setInputNumber(e.target.value)}
                            aria-invalid={isInvalid}
                            className="h-10 flex-1 font-mono"
                        />

                        {/*
                          Le bouton est désactivé si :
                           - une écriture est en attente de signature (isPendingWrite)
                           - une transaction est en cours de confirmation (isConfirming)  -> évite le double envoi
                           - la valeur saisie est invalide (isInvalid)
                           - le champ est vide (inputNumber === "")
                        */}
                        <Button
                            className="h-10 sm:w-44"
                            disabled={isPendingWrite || isConfirming || isInvalid || inputNumber === ""}
                            onClick={handleSubmitNumber}
                        >
                            {isPendingWrite ? (
                                <>
                                    <Loader2Icon className="animate-spin" />
                                    Signature en cours…
                                </>
                            ) : isConfirming ? (
                                <>
                                    <Loader2Icon className="animate-spin" />
                                    Confirmation…
                                </>
                            ) : (
                                <>
                                    Valider
                                    <ArrowRightIcon data-icon="inline-end" />
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Message d'aide affiché uniquement si la valeur dépasse la limite autorisée. */}
                    {isInvalid && (
                        <p className="mt-3 flex items-center gap-1.5 text-sm text-destructive">
                            <TriangleAlertIcon className="size-4 shrink-0" />
                            Le nombre doit être inférieur à {MAX_NUMBER}.
                        </p>
                    )}

                    {/* Retour visuel sur l'état de la transaction, affiché seulement quand c'est pertinent (&&). */}
                    {hash && (
                        <div className="mt-5 space-y-2.5 rounded-xl border border-border/60 bg-muted/30 p-4">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-xs font-medium text-muted-foreground">Transaction</span>
                                <span className="font-mono text-xs" title={hash}>{formatAddress(hash)}</span>
                            </div>
                            {isConfirming && (
                                <div className="flex items-center gap-2 text-xs text-amber-500 dark:text-amber-400">
                                    <span className="relative flex size-2">
                                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
                                        <span className="relative inline-flex size-2 rounded-full bg-current" />
                                    </span>
                                    En attente de confirmation…
                                </div>
                            )}
                            {isConfirmed && (
                                <div className="flex items-center gap-2 text-xs text-emerald-500 dark:text-emerald-400">
                                    <CircleCheckIcon className="size-4" />
                                    Transaction confirmée
                                </div>
                            )}
                        </div>
                    )}

                    {/* Affichage d'une éventuelle erreur d'écriture (ex : signature refusée dans le wallet). */}
                    {errorWrite && (
                        <Alert variant="destructive" className="mt-5 border-destructive/30">
                            <OctagonXIcon />
                            <AlertTitle>La transaction a échoué</AlertTitle>
                            <AlertDescription>
                                {(errorWrite as unknown as BaseError).shortMessage || errorWrite.message}
                            </AlertDescription>
                        </Alert>
                    )}
                </section>
            </div>

            {/* Composant enfant qui reçoit la liste des events en props et l'affiche. */}
            <Events events={events} />
        </div>
    )
}

export default SimpleStorage
