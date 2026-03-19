export interface DocEditorSnapshot {
  docId: string | null;
  content: string;
}

export const shouldSyncDocEditorFromRemote = (input: {
  previousSnapshot: DocEditorSnapshot;
  nextSnapshot: DocEditorSnapshot;
  editorValue: string;
}): boolean =>
  input.previousSnapshot.docId !== input.nextSnapshot.docId ||
  input.editorValue === input.previousSnapshot.content;

export const isStaleDocSaveResponse = (
  requestSeq: number,
  latestRequestSeq: number | undefined,
): boolean =>
  typeof latestRequestSeq === "number" && requestSeq < latestRequestSeq;
