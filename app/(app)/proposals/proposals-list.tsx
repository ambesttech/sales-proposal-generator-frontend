"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  deleteProposal,
  fetchProposalDetail,
  fetchProposalsList,
  type ProposalListItem,
  PROPOSALS_CATALOG_CHANGED_EVENT,
} from "@/lib/proposal/proposals-api";
import {
  downloadProposalAsDocx,
  downloadProposalAsPdf,
} from "@/lib/proposal/export-proposal-blob";

const userId =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_USER_ID ?? "")
    : "";

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function statusLabel(status: string) {
  if (status === "completed") return null;
  if (status === "processing") return "In progress";
  if (status === "failed") return "Failed";
  return status;
}

type RowBusy = null | "delete" | "pdf" | "word";

const MENU_MIN_WIDTH_PX = 208;

function menuLeftForTrigger(rect: DOMRect, menuWidth: number) {
  const pad = 8;
  let left = rect.right - menuWidth;
  return Math.max(pad, Math.min(left, window.innerWidth - menuWidth - pad));
}

function ProposalRowActions({
  proposalId,
  title,
  clientName,
  status,
  onRemoved,
}: {
  proposalId: string;
  title: string;
  clientName: string;
  status: string;
  onRemoved: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<RowBusy>(null);
  const [menuCoords, setMenuCoords] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const exportEnabled = status === "completed";

  const updateMenuCoords = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuCoords({
      top: rect.bottom + 4,
      left: menuLeftForTrigger(rect, MENU_MIN_WIDTH_PX),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setMenuCoords(null);
      return;
    }
    updateMenuCoords();
  }, [open, updateMenuCoords]);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => updateMenuCoords();
    window.addEventListener("resize", onScrollOrResize);
    document.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      document.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, updateMenuCoords]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Delete “${title.length > 80 ? `${title.slice(0, 80)}…` : title}”? This cannot be undone.`,
      )
    ) {
      return;
    }
    setBusy("delete");
    try {
      await deleteProposal(proposalId, userId);
      onRemoved(proposalId);
    } catch (e) {
      window.alert(
        e instanceof Error ? e.message : "Could not delete proposal.",
      );
    } finally {
      setBusy(null);
      setOpen(false);
    }
  };

  const runExport = async (kind: "pdf" | "word") => {
    setBusy(kind === "pdf" ? "pdf" : "word");
    try {
      const detail = await fetchProposalDetail(proposalId, userId);
      if (!detail?.proposal) {
        throw new Error(
          "Proposal is not available to export (not completed or missing document).",
        );
      }
      const nameHint = detail.clientName?.trim() || clientName.trim() || "proposal";
      if (kind === "pdf") {
        await downloadProposalAsPdf(detail.proposal, nameHint);
      } else {
        await downloadProposalAsDocx(detail.proposal, nameHint);
      }
      setOpen(false);
    } catch (e) {
      window.alert(
        e instanceof Error ? e.message : "Export failed.",
      );
    } finally {
      setBusy(null);
    }
  };

  const viewHref = `/proposals/${encodeURIComponent(proposalId)}`;

  const menu =
    open && menuCoords
      ? createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-orientation="vertical"
            style={{
              position: "fixed",
              top: menuCoords.top,
              left: menuCoords.left,
              minWidth: MENU_MIN_WIDTH_PX,
              zIndex: 200,
            }}
            className="rounded-lg border border-line bg-surface py-1 shadow-panel"
          >
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-ink transition hover:bg-surface-muted disabled:opacity-50"
              disabled={busy !== null || !exportEnabled}
              title={
                exportEnabled
                  ? undefined
                  : "Only completed proposals can be exported."
              }
              onClick={() => void runExport("pdf")}
            >
              Export as PDF
            </button>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-ink transition hover:bg-surface-muted disabled:opacity-50"
              disabled={busy !== null || !exportEnabled}
              title={
                exportEnabled
                  ? undefined
                  : "Only completed proposals can be exported."
              }
              onClick={() => void runExport("word")}
            >
              Export as Word
            </button>
            <div className="my-1 border-t border-line" role="separator" />
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-ink transition hover:bg-surface-muted disabled:opacity-50"
              disabled={busy !== null}
              onClick={() => void handleDelete()}
            >
              Delete
            </button>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="flex flex-nowrap items-center justify-end gap-2">
      <Link
        href={viewHref}
        className={`inline-flex shrink-0 items-center justify-center rounded-lg border border-line bg-accent px-2.5 py-1.5 text-xs font-medium text-accent-foreground shadow-sm transition hover:opacity-90 ${
          busy !== null ? "pointer-events-none opacity-50" : ""
        }`}
        aria-label={`View proposal: ${title}`}
      >
        View
      </Link>
      <div className="relative shrink-0">
        <button
          ref={buttonRef}
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink shadow-sm transition hover:bg-surface-muted disabled:opacity-50"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-controls={menuId}
          aria-label="More actions: export or delete"
          disabled={busy !== null}
          onClick={() => setOpen((v) => !v)}
        >
          {busy === "pdf"
            ? "PDF…"
            : busy === "word"
              ? "Word…"
              : busy === "delete"
                ? "Deleting…"
                : "More"}
          <svg
            className={`h-3.5 w-3.5 text-ink-soft transition ${open ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {menu}
      </div>
    </div>
  );
}

export function ProposalsList() {
  const [rows, setRows] = useState<ProposalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchProposalsList(userId, 200));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load proposals from API.",
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onRefresh = () => void refresh();
    window.addEventListener(PROPOSALS_CATALOG_CHANGED_EVENT, onRefresh);
    return () =>
      window.removeEventListener(PROPOSALS_CATALOG_CHANGED_EVENT, onRefresh);
  }, [refresh]);

  if (loading) {
    return (
      <p className="rounded-2xl border border-line bg-surface-muted/40 px-6 py-10 text-center text-sm text-ink-soft">
        Loading proposals…
      </p>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-line bg-surface-muted/40 px-6 py-10 text-center">
        <p className="text-sm text-ink-soft">{error}</p>
        <p className="mt-2 text-xs text-ink-soft">
          Ensure the FastAPI backend is running and{" "}
          <code className="rounded bg-surface px-1 py-0.5 font-mono text-[11px]">
            NEXT_PUBLIC_USER_ID
          </code>{" "}
          matches the{" "}
          <code className="rounded bg-surface px-1 py-0.5 font-mono text-[11px]">
            userId
          </code>{" "}
          sent when generating.
        </p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface-muted/40 px-6 py-12 text-center">
        <p className="text-sm text-ink-soft">
          No proposals in the database for this user yet. Run{" "}
          <span className="font-medium text-ink">Generate proposal</span> from
          the workspace (with the backend reachable).
        </p>
        <Link
          href="/create-proposal"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-sm transition hover:opacity-90"
        >
          Go to Create proposal
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-panel">
      <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-surface-muted/60">
            <th
              scope="col"
              className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-soft"
            >
              Title
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-soft"
            >
              Client
            </th>
            <th
              scope="col"
              className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-soft"
            >
              Status
            </th>
            <th
              scope="col"
              className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-soft"
            >
              Updated
            </th>
            <th
              scope="col"
              className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-ink-soft"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const badge = statusLabel(row.status);
            return (
              <tr
                key={row.id}
                className="border-b border-line last:border-b-0 transition hover:bg-surface-muted/50"
              >
                <td className="max-w-[14rem] px-4 py-3 align-middle">
                  <Link
                    href={`/proposals/${encodeURIComponent(row.id)}`}
                    className="block truncate font-medium text-ink underline-offset-2 hover:text-accent hover:underline"
                    title={row.title}
                  >
                    {row.title}
                  </Link>
                </td>
                <td className="max-w-[12rem] px-4 py-3 align-middle text-ink-soft">
                  <span
                    className="block truncate"
                    title={row.clientName || undefined}
                  >
                    {row.clientName || "—"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-middle">
                  {badge ? (
                    <span className="inline-flex rounded-md bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-soft ring-1 ring-line">
                      {badge}
                    </span>
                  ) : (
                    <span className="text-xs text-ink-soft">Completed</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-middle text-xs text-ink-soft">
                  {formatWhen(row.updatedAt)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 align-middle">
                  <ProposalRowActions
                    proposalId={row.id}
                    title={row.title}
                    clientName={row.clientName}
                    status={row.status}
                    onRemoved={removeRow}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
