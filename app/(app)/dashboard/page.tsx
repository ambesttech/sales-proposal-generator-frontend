import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="p-8 md:p-10">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Dashboard
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
        Start a new AI-generated proposal or review proposals you have already
        created. Everything is stored in this browser until you export.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/create-proposal"
          className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground shadow-sm transition hover:opacity-90"
        >
          Create proposal
        </Link>
        <Link
          href="/proposals"
          className="inline-flex items-center justify-center rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink shadow-sm transition hover:bg-surface-muted"
        >
          View proposals
        </Link>
      </div>
    </div>
  );
}
