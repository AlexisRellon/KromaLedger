import { formatCurrency } from "../../core/models";
import { usePresentationComponents } from "./PresentationContext";

export function WalletOverviewPanel({ walletCount, primaryWalletName, totalBalanceMinor, currency, onAddWallet }: {
  walletCount: number;
  primaryWalletName: string;
  totalBalanceMinor: number;
  currency: string;
  onAddWallet(): void;
}) {
  const { Box, Text, Button, Icon } = usePresentationComponents();
  return <Box surface="card" direction="row" align="between" gap="lg" padding="lg">
    <Box direction="column" gap="sm">
      <Box direction="row" align="center" gap="sm">
        <Icon name="credit-card" />
        <Text as="heading" size="xl" weight="bold">Liquid Wallets &amp; Accounts</Text>
        <Text as="caption" tone="muted">{walletCount} active</Text>
      </Box>
      <Text as="body" tone="muted">Manage cash vaults, bank accounts, credit cards, and digital e-wallets stored on-device.</Text>
      <Box direction="row" align="center" gap="md">
        <Text as="caption">Primary: {primaryWalletName || "None"}</Text>
        <Text as="caption" tone="muted">•</Text>
        <Text as="caption" tone="accent" mono>Total Liquid: {formatCurrency(totalBalanceMinor, currency)}</Text>
      </Box>
    </Box>
    <Button accessibilityLabel="Add New Card" variant="primary" onPress={onAddWallet}>
      <Icon name="plus" />
      <Text as="caption" weight="bold" tone="inverse">Add New Card</Text>
    </Button>
  </Box>;
}
