"use client";

import { FormField } from "@/components/ui/form-field";
import { useProposal } from "@/lib/proposal/proposal-context";

export function InputSidebar() {
  const { inputs, setField } = useProposal();

  return (
    <aside className="no-print flex h-full w-full max-w-md flex-col border-r border-line bg-surface-muted/80 backdrop-blur-sm">
      <header className="border-b border-line px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-soft">
          Intake
        </p>
        <h1 className="mt-1 text-lg font-semibold tracking-tight text-ink">
          Proposal inputs
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Details flow into the live preview on the right.
        </p>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
        <FormField id="clientName" label="Client name">
          <input
            id="clientName"
            type="text"
            autoComplete="organization"
            value={inputs.clientName}
            onChange={(e) => setField("clientName", e.target.value)}
            placeholder="Acme Industries"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink shadow-sm outline-none ring-accent/30 transition placeholder:text-ink-soft/60 focus:border-accent focus:ring-2"
          />
        </FormField>

        <FormField
          id="website"
          label="Website"
          hint="Used to tailor positioning and scope language."
        >
          <input
            id="website"
            type="url"
            inputMode="url"
            autoComplete="url"
            value={inputs.website}
            onChange={(e) => setField("website", e.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono text-sm text-ink shadow-sm outline-none ring-accent/30 transition placeholder:text-ink-soft/60 focus:border-accent focus:ring-2"
          />
        </FormField>

        <FormField id="budget" label="Budget">
          <input
            id="budget"
            type="text"
            value={inputs.budget}
            onChange={(e) => setField("budget", e.target.value)}
            placeholder="e.g. $45k – $60k"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink shadow-sm outline-none ring-accent/30 transition placeholder:text-ink-soft/60 focus:border-accent focus:ring-2"
          />
        </FormField>

        <FormField id="timeline" label="Timeline">
          <input
            id="timeline"
            type="text"
            value={inputs.timeline}
            onChange={(e) => setField("timeline", e.target.value)}
            placeholder="e.g. 8 weeks, start May"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink shadow-sm outline-none ring-accent/30 transition placeholder:text-ink-soft/60 focus:border-accent focus:ring-2"
          />
        </FormField>

        <FormField
          id="requirements"
          label="Requirements"
          hint="One line per item works well; we turn these into scope bullets."
        >
          <textarea
            id="requirements"
            value={inputs.requirements}
            onChange={(e) => setField("requirements", e.target.value)}
            placeholder={"CRM integration\nPartner portal MVP\nAnalytics dashboard"}
            rows={6}
            className="w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-sm leading-relaxed text-ink shadow-sm outline-none ring-accent/30 transition placeholder:text-ink-soft/60 focus:border-accent focus:ring-2"
          />
        </FormField>
      </div>

      <footer className="border-t border-line px-6 py-4">
        <p className="text-center text-[11px] leading-relaxed text-ink-soft">
          The preview updates as you type from the local draft template.{" "}
          <span className="font-medium text-ink">Generate proposal</span> runs the
          FastAPI + LangGraph pipeline (intake → requirements → retrieval → writer
          → review) when the backend is reachable.
        </p>
      </footer>
    </aside>
  );
}
