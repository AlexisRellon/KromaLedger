import type { Transaction } from "../models";

export type WalletActivityFilters = {
  search: string;
  type: "" | Transaction["type"] | "INVOICE";
  startDate: string;
  endDate: string;
};

export const EMPTY_ACTIVITY_FILTERS: WalletActivityFilters = { search: "", type: "", startDate: "", endDate: "" };

export function filterWalletActivity(transactions: Transaction[], filters: WalletActivityFilters) {
  const search = filters.search.trim().toLocaleLowerCase();
  return transactions.filter((tx) =>
    (!search || tx.title.toLocaleLowerCase().includes(search)) &&
    (!filters.type || (filters.type === "INVOICE" ? Boolean(tx.invoiceId) : tx.type === filters.type)) &&
    (!filters.startDate || tx.date >= filters.startDate) &&
    (!filters.endDate || tx.date <= filters.endDate)
  ).sort((a, b) => b.date.localeCompare(a.date));
}
