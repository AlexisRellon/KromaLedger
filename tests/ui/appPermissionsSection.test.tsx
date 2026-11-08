import "fake-indexeddb/auto";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppPermissionsSection } from "../../src/ui/components/AppPermissionsSection";
import { StorageProvider, type StorageServices } from "../../src/state/StorageContext";

function renderSection() {
  const mockStorageServices: StorageServices = {
    repo: {} as any,
    files: {} as any,
    vault: {
      export: vi.fn(),
      restore: vi.fn(),
    },
    storageStatus: async () => ({
      persistent: true,
      usage: 1048576, // 1 MB
      quota: 1073741824, // 1 GB
    }),
  };

  return renderToStaticMarkup(
    createElement(
      StorageProvider,
      { value: mockStorageServices },
      createElement(AppPermissionsSection, { onShowNotice: vi.fn() })
    )
  );
}

describe("AppPermissionsSection Component", () => {
  it("renders category title, subtitle, and badge", () => {
    const html = renderSection();
    expect(html).toContain("App permissions");
    expect(html).toContain("Review and configure on-device hardware access");
    expect(html).toContain("Permissions Ready");
  });

  it("renders notifications permission row with status and action", () => {
    const html = renderSection();
    expect(html).toContain("Notifications &amp; Alerts");
    expect(html).toContain("Sends timely reminders for recurring subscription payments");
  });

  it("renders persistent storage permission row", () => {
    const html = renderSection();
    expect(html).toContain("Persistent Local Storage");
    expect(html).toContain("Prevents your browser from clearing IndexedDB records");
  });

  it("renders camera Air-Sync optical scanner row", () => {
    const html = renderSection();
    expect(html).toContain("Camera (Air-Sync Optical Scanner)");
    expect(html).toContain("Used strictly when scanning animated QR codes in Air-Sync");
    expect(html).toContain("Test Camera Access");
  });

  it("renders system clipboard row", () => {
    const html = renderSection();
    expect(html).toContain("System Clipboard");
    expect(html).toContain("Verify Copy");
  });

  it("renders sandboxed file system row and local privacy guarantee", () => {
    const html = renderSection();
    expect(html).toContain("File System &amp; Encrypted Backups");
    expect(html).toContain("Sandboxed (Safe)");
    expect(html).toContain("100% Local-First Device Privacy");
  });
});
