# Gérer les *custom errors* du contrat côté frontend

Ce document explique comment récupérer, décoder et afficher proprement les erreurs
renvoyées par un smart contract (Solidity `custom errors`) dans une dApp React /
Next.js utilisant **wagmi** + **viem**.

On part du cas simple (`NumberTooBig`) et on va jusqu'aux cas avancés :
`onlyOwner`, `AccessControl` (rôles), et erreurs qui portent des **arguments**.

---

## 1. Le principe à retenir

| Couche | Rôle | On peut s'y fier pour la sécurité ? |
|--------|------|-------------------------------------|
| **Front** (validation avant envoi) | UX : feedback immédiat, éviter une transaction vouée à l'échec | ❌ Non, trivialement contournable |
| **Contrat** (`require` / `revert` + custom error) | Sécurité : source de vérité | ✅ Oui, c'est la seule vraie garantie |

**La validation front ne suffit pas** pour tout. Certaines erreurs ne sont
connaissables **qu'au moment de l'exécution**, parce qu'elles dépendent de l'état
de la blockchain :

- `onlyOwner` → « es-tu bien le propriétaire ? » (le front ne connaît pas forcément l'owner)
- soldes insuffisants, allowance ERC20 trop basse
- rôles (`AccessControl`), pause du contrat, deadline dépassée, etc.

Pour ces cas-là, on **doit** récupérer l'erreur émise par le contrat et la décoder.

---

## 2. Prérequis absolu : l'ABI doit contenir les erreurs

viem ne peut décoder **que** les erreurs qu'il connaît. Il faut donc que l'ABI
inclue les définitions `type: "error"`.

```json
{
  "inputs": [],
  "name": "NumberTooBig",
  "type": "error"
}
```

Bonne nouvelle : quand tu compiles avec Hardhat/Foundry, l'ABi généré
(`artifacts/contracts/SimpleStorage.sol/SimpleStorage.json` → champ `abi`)
contient **automatiquement** toutes les erreurs, **y compris celles héritées**
(par ex. `OwnableUnauthorizedAccount` venant d'OpenZeppelin).

👉 Règle : à chaque changement du contrat, **régénère/recopie l'ABI** dans ton front.
Une erreur absente de l'ABI ne pourra jamais être décodée (viem affichera juste
un blob hexadécimal `0x…`).

---

## 3. Pourquoi `useWriteContract` seul ne montre pas la bonne erreur

`useWriteContract` envoie la transaction **directement au wallet**. Si l'appel va
`revert` :

1. le wallet tente d'estimer le gas (`eth_estimateGas`),
2. l'estimation échoue (puisque ça revert),
3. selon le wallet/RPC, tu obtiens une erreur de gas peu claire (ex.
   « gas limit exceeds cap ») **qui masque la vraie raison**.

La solution : **simuler l'appel d'abord** (`eth_call`). Une simulation renvoie
proprement la *revert data*, que viem sait décoder en `custom error`.

---

## 4. La brique de base : décoder une erreur viem

Toutes les erreurs wagmi/viem héritent de `BaseError` et forment une **chaîne**
de causes. On la parcourt avec `.walk()` pour trouver l'erreur qui nous intéresse.

```ts
import { BaseError, ContractFunctionRevertedError } from 'viem'

function getRevertError(error: unknown) {
  if (error instanceof BaseError) {
    // .walk(fn) renvoie la première erreur de la chaîne qui correspond, sinon null
    const revertError = error.walk(
      (e) => e instanceof ContractFunctionRevertedError,
    )
    if (revertError instanceof ContractFunctionRevertedError) {
      return {
        name: revertError.data?.errorName, // ex: "NumberTooBig", "OwnableUnauthorizedAccount"
        args: revertError.data?.args ?? [], // les arguments de l'erreur (voir §7)
        reason: revertError.reason,          // pour un require(cond, "message string") classique
      }
    }
  }
  return null
}
```

- `revertError.data?.errorName` → le **nom** de la custom error.
- `revertError.data?.args` → ses **arguments** éventuels.
- `revertError.reason` → le message d'un `require(cond, "texte")` (ancien style, string).

---

## 5. Récupérer l'erreur au bon moment : `simulateContract`

### Option A — Simuler dans le handler (idéal quand les arguments viennent d'un input)

```tsx
import { publicClient } from '@/lib/client'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config'
import { parseContractError } from '@/lib/errors' // voir §6

const handleSubmit = async () => {
  setError('')
  try {
    // 1) eth_call : renvoie proprement la revert data si l'appel échoue
    await publicClient.simulateContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'setMyNumber',
      args: [BigInt(inputNumber)],
      account: address, // ⚠️ IMPORTANT pour onlyOwner : simuler AVEC le compte connecté
    })

    // 2) La simulation passe -> on envoie la vraie transaction
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'setMyNumber',
      args: [BigInt(inputNumber)],
    })
  } catch (err) {
    setError(parseContractError(err)) // message lisible pour l'utilisateur
  }
}
```

> 💡 Le paramètre `account` est crucial pour les erreurs liées à l'appelant
> (`onlyOwner`, rôles…). Sans lui, la simulation part d'un compte « neutre » et
> l'erreur d'autorisation ne se déclenchera pas de la même façon.
> Récupère l'adresse via `const { address } = useAccount()`.

### Option B — Le hook `useSimulateContract` (idéal pour des arguments fixes)

Pratique pour un bouton « Withdraw »/« Pause » réservé à l'owner : la simulation
tourne en continu, et son erreur est **déjà décodée**.

```tsx
import { useSimulateContract, useWriteContract } from 'wagmi'

const { data: sim, error: simError } = useSimulateContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'withdraw',
})

const { writeContract } = useWriteContract()

return (
  <>
    <button disabled={!sim} onClick={() => writeContract(sim!.request)}>
      Withdraw
    </button>
    {simError && <p>{parseContractError(simError)}</p>}
  </>
)
```

---

## 6. Traduire les erreurs en messages lisibles (le cœur du système)

On centralise tout dans un fichier `src/lib/errors.ts`. L'idée : un **dictionnaire**
qui associe chaque nom d'erreur du contrat à un message utilisateur, avec accès
aux arguments pour les messages dynamiques.

```ts
// src/lib/errors.ts
import {
  BaseError,
  ContractFunctionRevertedError,
  UserRejectedRequestError,
} from 'viem'

// Nom de la custom error (côté contrat) -> message affiché (côté utilisateur).
// La fonction reçoit les arguments de l'erreur, pour les messages dynamiques.
const ERROR_MESSAGES: Record<string, (args: readonly unknown[]) => string> = {
  NumberTooBig: () => 'Le nombre doit être inférieur à 10.',

  // OpenZeppelin Ownable v5 : error OwnableUnauthorizedAccount(address account)
  OwnableUnauthorizedAccount: () =>
    'Action réservée au propriétaire du contrat.',

  // OpenZeppelin AccessControl : error AccessControlUnauthorizedAccount(address, bytes32 role)
  AccessControlUnauthorizedAccount: () =>
    "Tu n'as pas le rôle requis pour effectuer cette action.",

  // Exemple d'erreur avec arguments : error InsufficientBalance(uint256 required, uint256 available)
  InsufficientBalance: (args) =>
    `Solde insuffisant : ${args[1]} disponible, ${args[0]} requis.`,
}

export function parseContractError(error: unknown): string {
  if (error instanceof BaseError) {
    // 1) L'utilisateur a refusé la signature dans son wallet
    const rejected = error.walk((e) => e instanceof UserRejectedRequestError)
    if (rejected) return 'Tu as refusé la transaction.'

    // 2) Le contrat a "revert" avec une custom error
    const revertError = error.walk(
      (e) => e instanceof ContractFunctionRevertedError,
    )
    if (revertError instanceof ContractFunctionRevertedError) {
      const name = revertError.data?.errorName
      const args = revertError.data?.args ?? []

      // a) On connaît cette erreur -> message dédié
      if (name && ERROR_MESSAGES[name]) return ERROR_MESSAGES[name](args)

      // b) require(cond, "message") classique (revert string)
      if (revertError.reason) return revertError.reason

      // c) Erreur custom non répertoriée -> au moins son nom
      if (name) return `Erreur du contrat : ${name}`
    }

    // 3) Repli : le message court de viem (déjà lisible)
    return error.shortMessage
  }

  return 'Une erreur inconnue est survenue.'
}
```

Ensuite, **partout** où tu affiches une erreur, tu passes par cette fonction :

```tsx
{errorWrite && <p>{parseContractError(errorWrite)}</p>}
```

Avantage : un seul endroit à maintenir, des messages cohérents dans toute l'app,
et l'ajout d'une nouvelle erreur = **une ligne** dans `ERROR_MESSAGES`.

---

## 7. Cas avancés

### 7.1 `onlyOwner` (OpenZeppelin Ownable v5)

Côté contrat :

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleStorage is Ownable {
    uint256 private myNumber;

    constructor() Ownable(msg.sender) {}

    function setMyNumber(uint256 _myNumber) external onlyOwner {
        myNumber = _myNumber;
    }
}
```

Depuis OpenZeppelin **v5**, `onlyOwner` ne revert plus avec une string mais avec
une **custom error** :

```solidity
error OwnableUnauthorizedAccount(address account);
```

- Elle est **automatiquement dans l'ABI** compilé (héritage) → viem sait la décoder.
- Côté front, tu la captures exactement comme les autres, via `parseContractError`.
- `args[0]` contient l'adresse refusée si tu veux l'afficher.

> ⚠️ Pense au paramètre `account` de `simulateContract` (§5, Option A), sinon la
> simulation ne « voit » pas quel compte appelle et l'erreur d'owner peut ne pas
> se déclencher correctement.

### 7.2 `AccessControl` (gestion par rôles)

```solidity
error AccessControlUnauthorizedAccount(address account, bytes32 neededRole);
```

Deux arguments : le compte refusé et le **rôle** manquant (un `bytes32`).
Tu peux afficher un message générique, ou mapper les hash de rôles connus vers
des libellés lisibles (`MINTER_ROLE`, `ADMIN_ROLE`…).

### 7.3 Erreurs avec arguments (messages dynamiques)

```solidity
error InsufficientBalance(uint256 required, uint256 available);
...
if (balance < amount) revert InsufficientBalance(amount, balance);
```

Côté front, `revertError.data.args` vaut `[required, available]` (des `bigint`).
On les exploite directement dans le message (voir `InsufficientBalance` dans le
dictionnaire du §6). Pense à formater les `bigint` (ex. `formatEther`) si ce sont
des montants en wei.

---

## 8. Ne pas oublier les erreurs « non custom »

`parseContractError` gère déjà ces cas courants :

- **Refus dans le wallet** → `UserRejectedRequestError` (l'utilisateur clique « Reject »).
- **`require(cond, "message")` ancien style** → récupéré via `revertError.reason`.
- **Panic Solidity** (division par zéro, dépassement, `assert`) → viem renvoie un
  `Panic` ; le repli `error.shortMessage` reste lisible.
- **Erreur réseau / RPC** → repli `error.shortMessage`.

---

## 9. Checklist de mise en place

1. ✅ L'ABI du front contient bien les `type: "error"` (y compris héritées d'OZ).
2. ✅ Créer `src/lib/errors.ts` avec `parseContractError` + le dictionnaire `ERROR_MESSAGES`.
3. ✅ **Simuler avant d'écrire** (`simulateContract`) pour obtenir la vraie raison du revert.
4. ✅ Pour les erreurs liées à l'appelant (`onlyOwner`, rôles) : passer `account` à la simulation.
5. ✅ Afficher **toutes** les erreurs via `parseContractError(...)` (jamais le message brut).
6. ✅ Garder la validation front simple (`< 10`) uniquement pour l'UX, pas pour la sécurité.

---

## 10. Résumé en une phrase

> La **validation front** évite les erreurs prévisibles (bon pour l'UX), mais pour
> tout ce qui dépend de l'**état de la blockchain** (`onlyOwner`, soldes, rôles),
> on **simule l'appel**, on **décode** la custom error avec
> `ContractFunctionRevertedError` + `.walk()`, et on la **traduit** via un
> dictionnaire centralisé.
