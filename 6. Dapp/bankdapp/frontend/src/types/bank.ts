// Typage strict pour les events
export type BankEvent = {
  type: 'Deposit' | 'Withdraw';
  account: string;
  amount: bigint;
  blockNumber: number;
};