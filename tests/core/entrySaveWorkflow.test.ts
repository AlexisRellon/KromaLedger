import { describe, expect, it, vi } from "vitest";
import { saveEntryAndAttachment, type EntrySaveProgress } from "../../src/state/entrySaveWorkflow";

describe("saveEntryAndAttachment", () => {
  it("does not duplicate an entry when attachment storage fails and the user retries", async () => {
    const progress: EntrySaveProgress = { entrySaved: false };
    const saveEntry = vi.fn().mockResolvedValue(undefined);
    const saveAttachment = vi.fn().mockRejectedValueOnce(new Error("quota")).mockResolvedValue(undefined);
    await expect(saveEntryAndAttachment(progress, saveEntry, () => saveAttachment())).rejects.toThrow("quota");
    expect(progress.entrySaved).toBe(true);
    await saveEntryAndAttachment(progress, saveEntry, () => saveAttachment());
    expect(saveEntry).toHaveBeenCalledTimes(1);
    expect(saveAttachment).toHaveBeenCalledTimes(2);
  });

  it("marks an entry saved only after the entry write succeeds", async () => {
    const progress: EntrySaveProgress = { entrySaved: false };
    const saveEntry = vi.fn().mockRejectedValueOnce(new Error("db")).mockResolvedValue(undefined);
    await expect(saveEntryAndAttachment(progress, saveEntry)).rejects.toThrow("db");
    expect(progress.entrySaved).toBe(false);
    await saveEntryAndAttachment(progress, saveEntry);
    expect(saveEntry).toHaveBeenCalledTimes(2);
  });
});
