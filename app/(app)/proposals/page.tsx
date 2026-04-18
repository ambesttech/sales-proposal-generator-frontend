import { ProposalsList } from "./proposals-list";

export default function ProposalsPage() {
  return (
    <div className="p-8 md:p-10">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Proposals
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
        Proposals are loaded from the FastAPI database for your{" "}
        <code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-[12px]">
          userId
        </code>{" "}
        (set{" "}
        <code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-[12px]">
          NEXT_PUBLIC_USER_ID
        </code>{" "}
        to match).
      </p>
      <div className="mt-8">
        <ProposalsList />
      </div>
    </div>
  );
}
