import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Tronque une adresse/un hash Ethereum pour l'affichage : 0x1234…abcd.
// Purement cosmétique : la valeur complète reste disponible via l'attribut title.
export function formatAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}
