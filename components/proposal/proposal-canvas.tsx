"use client";

import { useProposal } from "@/lib/proposal/proposal-context";
import type { AgentReview } from "@/lib/proposal/types";

function formatGeneratedAt(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function ReviewList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
        {title}
      </p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink">
        {items.map((line, idx) => (
          <li key={`${idx}-${line.slice(0, 120)}`}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

function AgentReviewPanel({ review }: { review: AgentReview }) {
  return (
    <div className="no-print rounded-xl border border-amber-200/80 bg-amber-50/50 px-5 py-4 text-ink shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-900/70">
            Agent review
          </p>
          <p className="mt-1 text-sm font-medium text-ink">
            {review.ready_to_send
              ? "Looks close to client-ready"
              : "Needs attention before sending"}
          </p>
        </div>
        {review.overall_verdict ? (
          <p className="max-w-md text-right text-sm leading-relaxed text-ink-soft">
            {review.overall_verdict}
          </p>
        ) : null}
      </div>
      <ReviewList title="Completeness" items={review.completeness_notes} />
      <ReviewList title="Consistency" items={review.consistency_notes} />
      <ReviewList title="Missing sections" items={review.missing_sections} />
      <ReviewList title="Risky claims" items={review.risky_claims} />
      <ReviewList title="Writing" items={review.weak_writing} />
      <ReviewList title="Suggested fixes" items={review.suggested_fixes} />
    </div>
  );
}

export function ProposalCanvas() {
  const { proposal, agentReview } = useProposal();

  return (
    <section className="relative flex min-h-0 flex-1 flex-col bg-surface">
      <header className="no-print flex shrink-0 items-start justify-between gap-4 border-b border-line px-8 py-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-soft">
            Generated proposal
          </p>
          <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-ink">
            {proposal.title}
          </h2>
        </div>
        <div className="rounded-lg border border-line bg-surface-muted/60 px-3 py-2 text-right">
          <p className="text-[10px] font-medium uppercase tracking-wide text-ink-soft">
            Last updated
          </p>
          <p className="mt-0.5 font-mono text-xs text-ink">
            {formatGeneratedAt(proposal.generatedAt)}
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8 print:overflow-visible print:p-0">
        {agentReview ? (
          <div className="mx-auto mb-6 max-w-3xl">
            <AgentReviewPanel review={agentReview} />
          </div>
        ) : null}
        <article
          id="proposal-document"
          className="proposal-document mx-auto max-w-3xl rounded-2xl border border-line bg-surface-muted/40 p-10 shadow-panel print:shadow-none"
        >
          <header className="mb-10 hidden print:block">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {proposal.title}
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              Last updated: {formatGeneratedAt(proposal.generatedAt)}
            </p>
          </header>
          <div>
            {proposal.sections.map((section) => (
              <section key={section.heading} className="mb-10 last:mb-0">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
                  {section.heading}
                </h3>
                <div className="whitespace-pre-wrap text-base leading-relaxed text-ink">
                  {section.body}
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
