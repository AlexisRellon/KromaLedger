import { useEffect, useState } from "react";
import { getTodayManila } from "../../core/engine/manilaDate";
import { matchBankPreset, PH_BANK_INTEREST_PRESETS } from "../../core/engine/phBankRegistry";
import type { InterestRule, InterestTier, Wallet } from "../../core/models";
import { useDeleteInterestRule, useInterestRules, useSaveInterestRule } from "../../state/queries";
import { Button, Input, Select } from "../primitives/controls";
import { Field } from "../primitives/forms";
import { ModalShell } from "../primitives/Modal";

export interface WalletInterestSettingsProps {
  wallet: Wallet;
  isOpen: boolean;
  onClose: () => void;
}

export function WalletInterestSettings({ wallet, isOpen, onClose }: WalletInterestSettingsProps) {
  const { data: rules = [] } = useInterestRules(wallet.id);
  const existingRule = rules[0];
  const saveRule = useSaveInterestRule();
  const deleteRule = useDeleteInterestRule();

  const matchedPreset = matchBankPreset(wallet.institution ?? wallet.name);
  const defaultPreset = matchedPreset ?? PH_BANK_INTEREST_PRESETS[0]!;

  const [enabled, setEnabled] = useState(true);
  const [presetId, setPresetId] = useState<string>(defaultPreset.presetId);
  const [tierMode, setTierMode] = useState<"MARGINAL" | "WHOLE_BALANCE">(defaultPreset.tierMode);
  const [tiers, setTiers] = useState<InterestTier[]>([...defaultPreset.tiers]);
  const [promoBoostPercent, setPromoBoostPercent] = useState("0");
  const [promoCapPhp, setPromoCapPhp] = useState("");
  const [promoExpiresOn, setPromoExpiresOn] = useState("");
  const [taxPercent, setTaxPercent] = useState(String(defaultPreset.withholdingTaxBps / 100));
  const [payoutFrequency, setPayoutFrequency] = useState<"DAILY" | "MONTHLY">(defaultPreset.payoutFrequency);
  const [monthlyPayoutDay, setMonthlyPayoutDay] = useState(String(defaultPreset.monthlyPayoutDay ?? 1));
  const [rounding, setRounding] = useState<"FLOOR" | "HALF_UP">(defaultPreset.rounding);
  const [startDate, setStartDate] = useState(getTodayManila());

  useEffect(() => {
    if (!isOpen) return;
    if (existingRule) {
      setEnabled(existingRule.enabled);
      setPresetId(existingRule.presetId ?? "custom");
      setTierMode(existingRule.tierMode);
      setTiers(existingRule.tiers);
      setPromoBoostPercent(String(existingRule.promoBoostBps / 100));
      setPromoCapPhp(existingRule.promoCapMinor ? String(existingRule.promoCapMinor / 100) : "");
      setPromoExpiresOn(existingRule.promoExpiresOn ?? "");
      setTaxPercent(String(existingRule.withholdingTaxBps / 100));
      setPayoutFrequency(existingRule.payoutFrequency);
      setMonthlyPayoutDay(String(existingRule.monthlyPayoutDay ?? 1));
      setRounding(existingRule.rounding);
      setStartDate(existingRule.startDate);
    } else if (matchedPreset) {
      applyPreset(matchedPreset.presetId);
    }
  }, [isOpen, existingRule?.id]);

  const applyPreset = (id: string) => {
    setPresetId(id);
    const preset = PH_BANK_INTEREST_PRESETS.find((p) => p.presetId === id);
    if (!preset) return;
    setTierMode(preset.tierMode);
    setTiers([...preset.tiers]);
    setTaxPercent(String(preset.withholdingTaxBps / 100));
    setPayoutFrequency(preset.payoutFrequency);
    setMonthlyPayoutDay(String(preset.monthlyPayoutDay ?? 1));
    setRounding(preset.rounding);
  };

  const handleSave = async () => {
    const selectedPreset = PH_BANK_INTEREST_PRESETS.find((p) => p.presetId === presetId);
    const rule: InterestRule = {
      id: existingRule?.id ?? `interest-rule:${wallet.id}`,
      walletId: wallet.id,
      enabled,
      presetId: selectedPreset?.presetId,
      presetVersion: selectedPreset?.presetVersion,
      tiers,
      tierMode,
      promoBoostBps: Math.max(0, Math.round((Number(promoBoostPercent) || 0) * 100)),
      promoCapMinor: promoCapPhp.trim() ? Math.round(Number(promoCapPhp) * 100) : undefined,
      promoExpiresOn: promoExpiresOn.trim() || undefined,
      withholdingTaxBps: Math.max(0, Math.min(10000, Math.round((Number(taxPercent) || 0) * 100))),
      dayCountBasis: selectedPreset?.dayCountBasis ?? 365,
      payoutFrequency,
      monthlyPayoutDay: payoutFrequency === "MONTHLY" ? Math.max(1, Math.min(31, Number(monthlyPayoutDay) || 1)) : undefined,
      rounding,
      startDate,
      lastPostedPeriodKey: existingRule?.lastPostedPeriodKey,
    };
    await saveRule.mutateAsync(rule);
    onClose();
  };

  const handleDisableAndRemove = async () => {
    if (existingRule) {
      await deleteRule.mutateAsync(existingRule.id);
    }
    onClose();
  };

  if (wallet.type === "CASH") return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={`Interest Rules · ${wallet.name}`}
      subtitle="Prioritizes PH digital bank presets; customize rates to match your bank app."
      maxWidth="lg"
    >
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] cursor-pointer">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Enable automated interest posting
        </label>

        <Field label="PH Bank Preset">
          <Select value={presetId} onChange={(e) => applyPreset(e.target.value)}>
            {PH_BANK_INTEREST_PRESETS.map((p) => (
              <option key={p.presetId} value={p.presetId}>
                {p.name} ({p.payoutFrequency === "DAILY" ? "Daily" : "Monthly"})
              </option>
            ))}
            <option value="custom">Custom Rule</option>
          </Select>
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Base Rate (% p.a.)">
            <Input
              type="number"
              step="0.01"
              value={String((tiers[0]?.rateBps ?? 0) / 100)}
              onChange={(e) => {
                const bps = Math.max(0, Math.round((Number(e.target.value) || 0) * 100));
                setTiers((prev) => prev.map((t, idx) => (idx === 0 ? { ...t, rateBps: bps } : t)));
              }}
            />
          </Field>
          <Field label="Withholding Tax (%)">
            <Input type="number" step="0.1" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Promo Boost (% p.a.)">
            <Input type="number" step="0.01" value={promoBoostPercent} onChange={(e) => setPromoBoostPercent(e.target.value)} />
          </Field>
          <Field label="Promo Cap (PHP)">
            <Input type="number" placeholder="Optional" value={promoCapPhp} onChange={(e) => setPromoCapPhp(e.target.value)} />
          </Field>
          <Field label="Promo Expires On">
            <Input type="date" value={promoExpiresOn} onChange={(e) => setPromoExpiresOn(e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Payout Frequency">
            <Select value={payoutFrequency} onChange={(e) => setPayoutFrequency(e.target.value as "DAILY" | "MONTHLY")}>
              <option value="DAILY">Daily</option>
              <option value="MONTHLY">Monthly</option>
            </Select>
          </Field>
          {payoutFrequency === "MONTHLY" && (
            <Field label="Payout Day (1-31)">
              <Input type="number" min={1} max={31} value={monthlyPayoutDay} onChange={(e) => setMonthlyPayoutDay(e.target.value)} />
            </Field>
          )}
          <Field label="Start Date (Asia/Manila)">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
        </div>

        <div className="flex flex-wrap justify-between gap-2 pt-2">
          {existingRule ? (
            <Button variant="ghost" onClick={handleDisableAndRemove} disabled={deleteRule.isPending}>
              Remove Rule
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saveRule.isPending}>
              Save Interest Rule
            </Button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
