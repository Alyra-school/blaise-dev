// Le type qui décrit la forme d'un event affiché : { by: string, number: string }.
// On l'importe pour typer correctement les props reçues.
import { SimpleStorageEvent } from '@/types'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { HistoryIcon, InboxIcon } from "lucide-react"

// Utilitaire d'affichage : tronque les adresses (0x1234…abcd).
import { formatAddress } from '@/lib/utils'

// Ce composant est "présentationnel" (dumb component) : il ne gère aucune logique blockchain.
// Il reçoit simplement une liste d'events via les props et se contente de l'afficher.
// Toute la logique (récupération des events) est dans le parent SimpleStorage.
//
// { events }: { events: SimpleStorageEvent[] } = déstructuration des props + typage TypeScript :
// on dit que ce composant attend une prop "events" qui est un tableau de SimpleStorageEvent.
const Events = ({ events }: { events: SimpleStorageEvent[] }) => {
  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">

        {/* En-tête de la carte : titre + compteur d'événements */}
        <header className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <div className="flex items-center gap-2">
                <HistoryIcon className="size-4 text-primary" />
                <h2 className="text-sm font-semibold">Historique des événements</h2>
            </div>
            <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 font-mono text-xs font-medium text-primary">
                {events.length}
            </span>
        </header>

        {/*
          Rendu conditionnel avec l'opérateur ternaire (condition ? siVrai : siFaux).
          - Si le tableau contient au moins un event -> on affiche la table.
          - Sinon -> on affiche un état vide, en dehors de la table (HTML valide).
        */}
        {events.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6 text-xs text-muted-foreground">Compte</TableHead>
                  <TableHead className="pr-6 text-right text-xs text-muted-foreground">Valeur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* .map() transforme chaque event en une ligne de table (<TableRow>).
                    Le second paramètre "index" est la position de l'element dans le tableau. */}
                {events.map((event, index) =>
                    (
                        // La "key" aide React à identifier chaque élément d'une liste pour
                        // optimiser les mises à jour. Elle doit être STABLE (pas aléatoire).
                        // Ici on utilise l'index, ce qui est acceptable car la liste ne fait
                        // que s'agrandir (les events passés ne changent jamais d'ordre).
                        <TableRow key={index}>
                          <TableCell className="pl-6">
                            {/* Adresse tronquée pour la lisibilité ; complète au survol (title). */}
                            <span className="font-mono text-xs text-muted-foreground" title={event.by}>
                                {formatAddress(event.by)}
                            </span>
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <span className="inline-flex min-w-8 items-center justify-center rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-medium text-primary">
                                {event.number}
                            </span>
                          </TableCell>
                        </TableRow>
                    ))}
              </TableBody>
            </Table>
        ) : (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <InboxIcon className="size-5 text-muted-foreground/60" />
                <p className="text-sm text-muted-foreground">Aucun événement pour le moment.</p>
            </div>
        )}
    </section>
  )
}

// On exporte le composant pour pouvoir l'importer et l'utiliser dans SimpleStorage.
export default Events
