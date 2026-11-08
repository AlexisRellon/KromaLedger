import "fake-indexeddb/auto";
import { createElement } from "react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KabanDB } from "../../src/adapters/web-dexie/db";
import { DexieStorageRepo } from "../../src/adapters/web-dexie/DexieStorageRepo";
import { DexieFileStore } from "../../src/adapters/web-dexie/DexieFileStore";
import { StorageProvider, type StorageServices } from "../../src/state/StorageContext";
import { WebPresentationProvider } from "../../src/ui/adapters/WebPresentationProvider";
import { BaulitoTour } from "../../src/ui/components/BaulitoTour";

let db: KabanDB;
let services: StorageServices;
let restoreMock: (data: Uint8Array) => Promise<void>;

beforeEach(async () => {
  db = new KabanDB();
  await db.delete();
  db = new KabanDB();
  const repo = new DexieStorageRepo(db);
  const files = new DexieFileStore(db);
  restoreMock = vi.fn(async (_data: Uint8Array) => undefined);
  services = {
    repo,
    files,
    vault: {
      export: async () => ({ filename: "kaban-vault-2026-11-08.zip", data: new Uint8Array() }),
      restore: restoreMock,
    },
    storageStatus: async () => ({ persistent: true, usage: 1024, quota: 1024 * 1024 }),
  };
});

afterEach(() => {
  db.close();
});

function renderTour(initialStep = 0) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client },
      createElement(
        StorageProvider,
        { value: services },
        createElement(WebPresentationProvider, null, createElement(BaulitoTour, { onClose: () => {}, initialStep }))
      )
    )
  );
}

describe("BaulitoTour Onboarding Component", () => {
  it("renders a segmented progress bar with 9 distinct segments and progressbar ARIA semantics", () => {
    const html = renderTour(0);
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuemin="1"');
    expect(html).toContain('aria-valuemax="9"');
    expect(html).toContain('aria-valuenow="1"');
    expect(html).toContain('aria-valuetext="Step 1 of 9"');

    const segmentMatches = html.match(/class="[^"]*onboarding-progress[^"]*"/g);
    expect(segmentMatches).toHaveLength(9);

    // Segment 0 is filled at step 0 (scaleX(1)), subsequent segments are scaleX(0)
    expect(html).toContain("transform:scaleX(1)");
    expect(html).toContain("transform:scaleX(0)");
  });

  it("renders welcome step (step 0) with 'Get started' and Baulito welcome mascot", () => {
    const html = renderTour(0);
    expect(html).toContain("Your money,\nwith a little more clarity.");
    expect(html).toContain("Meet Baulito");
    expect(html).toContain("Get started");
    expect(html).toContain("baulito-welcome.svg");
    expect(html).not.toContain(">Back<");
  });

  it("renders backup import step (step 1) right after welcome step", () => {
    const html = renderTour(1);
    expect(html).toContain('aria-valuenow="2"');
    expect(html).toContain('aria-valuetext="Step 2 of 9"');
    expect(html).toContain("Have a backup\nto import?");
    expect(html).toContain("Import backup file (.zip)");
    expect(html).toContain("Start fresh (no backup)");
    expect(html).toContain("baulito-vault-locked.svg");
    expect(html).toContain(">Back<");
  });

  it("renders walkthrough step 1 (step 2): 'A place for every peso.'", () => {
    const html = renderTour(2);
    expect(html).toContain('aria-valuenow="3"');
    expect(html).toContain("A place for every peso.");
    expect(html).toContain("baulito-saving-up.svg");
    expect(html).toContain("Continue");
  });

  it("renders walkthrough step 2 with practice (step 3): 'Make every entry count.'", () => {
    const html = renderTour(3);
    expect(html).toContain('aria-valuenow="4"');
    expect(html).toContain("Make every entry count.");
    expect(html).toContain("baulito-calculating.svg");
    expect(html).toContain("Try an expense");
    expect(html).toContain("Try a transfer");
  });

  it("renders walkthrough step 3 with practice (step 4): 'Keep what\\'s ahead in view.'", () => {
    const html = renderTour(4);
    expect(html).toContain('aria-valuenow="5"');
    expect(html).toContain("Keep what&#x27;s ahead in view.");
    expect(html).toContain("Try a subscription");
    expect(html).toContain("Try an invoice");
  });

  it("renders profile setup (step 5): 'Make it yours.'", () => {
    const html = renderTour(5);
    expect(html).toContain('aria-valuenow="6"');
    expect(html).toContain("Make it yours.");
  });

  it("renders wallet setup (step 6): 'Add your first wallet.'", () => {
    const html = renderTour(6);
    expect(html).toContain('aria-valuenow="7"');
    expect(html).toContain("Add your first wallet.");
    expect(html).toContain("Wallet name");
  });

  it("renders notification setup (step 7): 'A little heads-up?'", () => {
    const html = renderTour(7);
    expect(html).toContain('aria-valuenow="8"');
    expect(html).toContain("A little heads-up?");
    expect(html).toContain("baulito-alert-peek.svg");
  });

  it("renders final step (step 8): 'You\\'re all set.' with all 9 segments filled", () => {
    const html = renderTour(8);
    expect(html).toContain('aria-valuenow="9"');
    expect(html).toContain('aria-valuetext="Step 9 of 9"');
    expect(html).toContain("You&#x27;re all set.");
    expect(html).toContain("Open my ledger");
    expect(html).toContain("baulito-celebrate-peso.svg");
    expect(html).not.toContain("transform:scaleX(0)");
  });

  it("provides file input accepting .zip backups on backup step", () => {
    const html = renderTour(1);
    expect(html).toContain('type="file"');
    expect(html).toContain('accept=".zip,application/zip"');
    expect(html).toContain("Accepts Kaban or legacy KromaLedger archives");
  });
});
