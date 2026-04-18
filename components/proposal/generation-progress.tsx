"use client";

import { useProposal } from "@/lib/proposal/proposal-context";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function GenerationProgress() {
  const { generationProgress, isGenerating } = useProposal();

  if (!generationProgress) return null;

  const { steps, statusById } = generationProgress;

  return (
    <div
      className="no-print border-b border-line bg-surface-muted/90 px-4 py-3 backdrop-blur-sm md:px-6"
      role="status"
      aria-live="polite"
      aria-busy={isGenerating}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-soft">
          Agent pipeline
        </p>
        <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-3">
          {steps.map((step, index) => {
            const status = statusById[step.id] ?? "pending";
            const isLast = index === steps.length - 1;
            return (
              <li
                key={step.id}
                className="flex min-w-0 flex-1 items-start gap-2 sm:max-w-[14rem] sm:flex-1"
              >
                <div className="flex shrink-0 flex-col items-center pt-0.5">
                  <span
                    className={[
                      "flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums transition",
                      status === "completed"
                        ? "border-emerald-500/70 bg-emerald-500/15 text-emerald-800"
                        : status === "running"
                          ? "border-accent bg-accent/10 text-accent ring-2 ring-accent/35 animate-pulse"
                          : status === "failed"
                            ? "border-red-400 bg-red-50 text-red-700"
                            : "border-line bg-surface text-ink-soft",
                    ].join(" ")}
                    aria-hidden
                  >
                    {status === "completed" ? (
                      <CheckIcon className="text-emerald-800" />
                    ) : status === "failed" ? (
                      "!"
                    ) : (
                      index + 1
                    )}
                  </span>
                  {!isLast ? (
                    <span
                      className="mt-1 hidden h-6 w-px bg-line sm:block"
                      aria-hidden
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={[
                      "text-sm font-medium leading-snug",
                      status === "running" ? "text-ink" : "text-ink-soft",
                    ].join(" ")}
                  >
                    {step.title}
                    {status === "running" ? (
                      <span className="ml-1.5 font-normal text-accent">
                        Running…
                      </span>
                    ) : null}
                  </p>
                  {step.detail ? (
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                      {step.detail}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
