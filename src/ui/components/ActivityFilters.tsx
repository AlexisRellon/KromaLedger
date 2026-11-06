import { EMPTY_ACTIVITY_FILTERS, type WalletActivityFilters } from "../../core/engine/walletActivity";
import { Button, Input, Select } from "../primitives/controls";
import { Field } from "../primitives/forms";

export function ActivityFilters({ filters, onChange, shownCount, totalCount }: {
  filters: WalletActivityFilters;
  onChange: (patch: Partial<WalletActivityFilters>) => void;
  shownCount: number;
  totalCount: number;
}) {
  const invalidRange = Boolean(filters.startDate && filters.endDate && filters.startDate > filters.endDate);
  const hasFilters = Boolean(filters.search || filters.type || filters.startDate || filters.endDate);
  return (
    <div className="mb-5 space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Search entries" className="min-w-0">
          <Input type="search" placeholder="Search by title" value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })} />
        </Field>
        <Field label="Entry type" className="min-w-0">
          <Select value={filters.type}
            onChange={(e) => onChange({ type: e.target.value as WalletActivityFilters["type"] })}>
            <option value="">All types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expenses</option>
            <option value="TRANSFER">Transfers</option>
            <option value="SUBSCRIPTION_PAYMENT">Subscription payments</option>
            <option value="INVOICE">Invoices</option>
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="From date" className="min-w-0">
          <Input type="date" className="min-w-0" value={filters.startDate} max={filters.endDate || "9999-12-31"}
            onChange={(e) => onChange({ startDate: e.target.value })} />
        </Field>
        <Field label="To date" className="min-w-0"
          error={invalidRange ? "Choose a date on or after the from date." : undefined}>
          <Input type="date" className="min-w-0" value={filters.endDate} min={filters.startDate || undefined} max="9999-12-31"
            onChange={(e) => onChange({ endDate: e.target.value })} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p role="status" className="text-xs font-semibold text-neutral-600">
          Showing {shownCount} of {totalCount} entries
        </p>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_ACTIVITY_FILTERS)}>Clear filters</Button>
        )}
      </div>
    </div>
  );
}
