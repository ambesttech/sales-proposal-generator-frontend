"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  fetchProposalDetail,
  type ProposalDetailResponse,
} from "@/lib/proposal/proposals-api";

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

export function ProposalDetailClient() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const [entry, setEntry] = useState<ProposalDetailResponse | null | undefined>(
    undefined,
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setEntry(null);
      return;
    }
    setError(null);
    try {
      const data = await fetchProposalDetail(id, userId);
      setEntry(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load proposal from API.",
      );
      setEntry(null);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <div className="p-8 md:p-10">
        <p className="text-sm text-ink-soft">{error}</p>
        <button
          type="button"
          onClick={() => router.push("/proposals")}
          className="mt-4 text-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          Back to Proposals
        </button>
      </div>
    );
  }

  if (entry === undefined) {
    return (
      <div className="p-8 md:p-10">
        <p className="text-sm text-ink-soft">Loading…</p>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="p-8 md:p-10">
        <p className="text-sm text-ink-soft">This proposal was not found.</p>
        <button
          type="button"
          onClick={() => router.push("/proposals")}
          className="mt-4 text-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          Back to Proposals
        </button>
      </div>
    );
  }

  const { proposal } = entry;

  if (!proposal || entry.status !== "completed") {
    return (
      <div className="p-8 md:p-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {entry.title}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              {entry.clientName || "—"} · {entry.status} ·{" "}
              {formatWhen(entry.updatedAt)}
            </p>
          </div>
          <Link
            href="/create-proposal"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink shadow-sm transition hover:bg-surface-muted"
          >
            New proposal
          </Link>
        </div>
        <p className="text-sm text-ink-soft">
          {entry.status === "processing"
            ? "This run is still processing or was interrupted."
            : entry.status === "failed"
              ? "Generation did not complete successfully."
              : "No document body is available for this record."}
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {proposal.title}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {entry.clientName || "—"} · Updated {formatWhen(entry.updatedAt)}
          </p>
        </div>
        <Link
          href="/create-proposal"
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink shadow-sm transition hover:bg-surface-muted"
        >
          New proposal
        </Link>
      </div>

      <article
        id="proposal-document"
        className="proposal-document mx-auto max-w-3xl rounded-2xl border border-line bg-surface-muted/40 p-10 shadow-panel print:shadow-none"
      >
        <header className="border-b border-line pb-6">
          <h2 className="text-xl font-semibold text-ink">{proposal.title}</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Generated: {formatWhen(proposal.generatedAt)}
          </p>
        </header>
        <div className="mt-8 space-y-8">
          {proposal.sections.map((section) => (
            <section key={section.heading}>
              <h3 className="text-lg font-semibold text-ink">
                {section.heading}
              </h3>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {section.body}
              </div>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
