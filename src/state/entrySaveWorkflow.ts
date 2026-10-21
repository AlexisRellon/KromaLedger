export type EntrySaveProgress = { entrySaved: boolean };

export async function saveEntryAndAttachment(
  progress: EntrySaveProgress,
  saveEntry: () => Promise<unknown>,
  saveAttachment?: () => Promise<unknown>,
): Promise<void> {
  if (!progress.entrySaved) {
    await saveEntry();
    progress.entrySaved = true;
  }
  if (saveAttachment) await saveAttachment();
}
