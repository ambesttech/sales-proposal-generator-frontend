"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildDraftPayload,
  draftFilenameBase,
  persistDraftToStorage,
} from "@/lib/proposal/draft-file";
import { downloadBlob } from "@/lib/proposal/download";
import {
  downloadProposalAsDocx,
  downloadProposalAsPdf,
} from "@/lib/proposal/export-proposal-blob";
import { useProposal } from "@/lib/proposal/proposal-context";

const baseBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50";

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ProposalActionToolbar() {
  const { inputs, proposal, isGenerating, lastError, generateProposal } =
    useProposal();
  const [exportBusy, setExportBusy] = useState<"pdf" | "docx" | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportMenuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExportMenuOpen(false);
    };

    const onPointerDown = (e: PointerEvent) => {
      const el = exportMenuRef.current;
      if (el && !el.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [exportMenuOpen]);

  const onSaveDraft = useCallback(() => {
    const payload = buildDraftPayload(inputs, proposal);
    persistDraftToStorage(payload);
    const base = draftFilenameBase(inputs.clientName);
    const stamp = payload.savedAt.slice(0, 19).replace(/[:T]/g, "-");
    const json = JSON.stringify(payload, null, 2);
    downloadBlob(
      new Blob([json], { type: "application/json" }),
      `${base}-${stamp}.json`,
    );
  }, [inputs, proposal]);

  const onExportPdf = useCallback(async () => {
    setExportMenuOpen(false);
    setExportBusy("pdf");
    try {
      await downloadProposalAsPdf(proposal, inputs.clientName);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Could not build the PDF.";
      window.alert(
        `${msg}\n\nIf this persists, restart the dev server and try again.`,
      );
    } finally {
      setExportBusy(null);
    }
  }, [inputs.clientName, proposal]);

  const onExportDocx = useCallback(async () => {
    setExportMenuOpen(false);
    setExportBusy("docx");
    try {
      await downloadProposalAsDocx(proposal, inputs.clientName);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Could not build the Word document.";
      window.alert(
        `${msg}\n\nIf you changed dependencies, run npm install and restart the dev server.`,
      );
    } finally {
      setExportBusy(null);
    }
  }, [inputs.clientName, proposal]);

  return (
    <header className="no-print relative z-30 isolate flex shrink-0 flex-wrap items-center gap-3 border-b border-line bg-surface-muted/60 px-4 py-3 backdrop-blur-sm md:px-6">
      <div className="mr-auto min-w-0">
        <p className="truncate text-xs font-semibold uppercase tracking-widest text-ink-soft">
          Workspace
        </p>
        <p className="truncate text-sm text-ink-soft">
          Generate, save, and export your proposal
        </p>
        {lastError ? (
          <p
            className="mt-1 max-w-xl text-xs leading-relaxed text-red-600"
            role="alert"
          >
            {lastError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`${baseBtn} bg-accent text-accent-foreground shadow-panel hover:opacity-95 active:opacity-90`}
          onClick={() => void generateProposal()}
          disabled={isGenerating}
        >
          {isGenerating ? "Generating…" : "Generate proposal"}
        </button>

        {/* <button
          type="button"
          className={`${baseBtn} border border-line bg-surface text-ink shadow-sm hover:bg-surface-muted/80`}
          onClick={onSaveDraft}
        >
          Save draft
        </button> */}

        <span
          className="hidden h-6 w-px bg-line sm:block"
          aria-hidden
        />

        <div className="relative" ref={exportMenuRef}>
          <button
            type="button"
            className={`${baseBtn} border border-line bg-surface text-ink shadow-sm hover:bg-surface-muted/80`}
            aria-expanded={exportMenuOpen}
            aria-haspopup="menu"
            aria-controls="export-proposal-menu"
            id="export-proposal-trigger"
            onClick={() => setExportMenuOpen((o) => !o)}
            disabled={exportBusy !== null}
          >
            Export
            <ChevronDownIcon
              className={`shrink-0 opacity-70 transition-transform ${exportMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {exportMenuOpen ? (
            <div
              id="export-proposal-menu"
              role="menu"
              aria-labelledby="export-proposal-trigger"
              className="absolute right-0 top-[calc(100%+0.25rem)] z-50 min-w-[11.5rem] rounded-lg border border-line bg-surface py-1 shadow-panel ring-1 ring-black/5"
            >
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center px-3 py-2 text-left text-sm text-ink hover:bg-surface-muted/80 disabled:opacity-50"
                onClick={() => void onExportPdf()}
                disabled={exportBusy !== null}
              >
                {exportBusy === "pdf" ? "Building PDF…" : "Export PDF"}
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center px-3 py-2 text-left text-sm text-ink hover:bg-surface-muted/80 disabled:opacity-50"
                onClick={() => void onExportDocx()}
                disabled={exportBusy !== null}
              >
                {exportBusy === "docx" ? "Building DOCX…" : "Export DOCX"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
