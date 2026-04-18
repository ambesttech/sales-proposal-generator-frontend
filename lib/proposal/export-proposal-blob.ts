import { draftFilenameBase } from "./draft-file";
import { downloadBlob } from "./download";
import type { ProposalDocument } from "./types";

async function postProposalExport(
  path: "/api/proposals/pdf" | "/api/proposals/docx",
  proposal: ProposalDocument,
): Promise<Blob> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proposal }),
  });
  if (!res.ok) {
    let detail = `Server returned ${res.status}`;
    try {
      const data = (await res.json()) as { detail?: string; error?: string };
      if (data.detail) detail = data.detail;
      else if (data.error) detail = data.error;
    } catch {
      /* not JSON */
    }
    throw new Error(detail);
  }
  return res.blob();
}

export async function downloadProposalAsPdf(
  proposal: ProposalDocument,
  clientNameForFile: string,
): Promise<void> {
  const blob = await postProposalExport("/api/proposals/pdf", proposal);
  const base = draftFilenameBase(clientNameForFile);
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  downloadBlob(blob, `${base}-${stamp}.pdf`);
}

export async function downloadProposalAsDocx(
  proposal: ProposalDocument,
  clientNameForFile: string,
): Promise<void> {
  const blob = await postProposalExport("/api/proposals/docx", proposal);
  const base = draftFilenameBase(clientNameForFile);
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  downloadBlob(blob, `${base}-${stamp}.docx`);
}
