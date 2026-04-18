import type { ProposalDocument, ProposalInputs } from "./types";

export type SavedDraftPayload = {
  version: 1;
  savedAt: string;
  inputs: ProposalInputs;
  proposal: ProposalDocument;
};

const STORAGE_KEY = "sales-proposal-draft";

export function buildDraftPayload(
  inputs: ProposalInputs,
  proposal: ProposalDocument,
): SavedDraftPayload {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    inputs,
    proposal,
  };
}

export function persistDraftToStorage(payload: SavedDraftPayload) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}

export function draftFilenameBase(clientName: string) {
  const slug = clientName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "proposal-draft";
}
