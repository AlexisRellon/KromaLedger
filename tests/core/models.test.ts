import { describe, expect, it } from "vitest";
import { attachmentMetaSchema, formatCurrency, formatWalletLabel, transactionSchema } from "../../src/core/models";

describe("core models", () => {
  it("validates transactions in integer minor units", () => {
    expect(transactionSchema.safeParse({ id: "1", date: "2026-10-20", title: "Lunch", amountMinor: -1250, currency: "PHP", type: "EXPENSE" }).success).toBe(true);
    expect(transactionSchema.safeParse({ id: "1", date: "2026-10-20", title: "Lunch", amountMinor: -12.5, currency: "PHP", type: "EXPENSE" }).success).toBe(false);
    expect(transactionSchema.safeParse({
      id: "tx-xfer",
      date: "2026-10-20",
      title: "Transfer to GCash",
      amountMinor: 100000,
      currency: "PHP",
      type: "TRANSFER",
      walletId: "w-mari",
      toWalletId: "w-gcash",
      feeMinor: 1000,
      channel: "INSTAPAY",
    }).success).toBe(true);
  });
  it("formats PHP amounts with the peso sign by default", () => expect(formatCurrency(123456)).toContain("₱1,234.56"));

  it("formats wallet labels with institution and name with deduplication", () => {
    expect(formatWalletLabel({ name: "Checking", institution: "BDO" })).toBe("BDO · Checking");
    expect(formatWalletLabel({ name: "GCash", institution: "GCash" })).toBe("GCash");
    expect(formatWalletLabel({ name: "Physical Cash" })).toBe("Physical Cash");
    expect(formatWalletLabel({ name: "Vault", institution: "  " })).toBe("Vault");
  });

  it("allows only safe attachment MIME types and rejects HTML/SVG/arbitrary types", () => {
    const validMeta = {
      id: "att-1",
      filename: "receipt.png",
      mimeType: "image/png",
      size: 1024,
      createdAt: "2026-10-20T10:00:00.000Z",
      entityType: "TRANSACTION" as const,
      entityId: "tx-1",
    };
    for (const mimeType of ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"]) {
      expect(attachmentMetaSchema.safeParse({ ...validMeta, mimeType }).success).toBe(true);
    }
    for (const mimeType of ["image/svg+xml", "text/html", "text/javascript", "application/x-sh", "application/octet-stream", ""]) {
      expect(attachmentMetaSchema.safeParse({ ...validMeta, mimeType }).success).toBe(false);
    }
  });
});
