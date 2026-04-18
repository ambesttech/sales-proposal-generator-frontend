"use client";

import { useState } from "react";

export function UploadDocumentForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".json")) {
      setError("Please choose a .json file.");
      setMessage(null);
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const text = await file.text();
      const json: unknown = JSON.parse(text);

      const publicBase =
        process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
      const url = publicBase
        ? `${publicBase}/api/v1/knowledge/import`
        : "/api/v1/knowledge/import";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });

      const raw = await res.text();
      let data: unknown = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        let detail = raw || `Request failed (${res.status})`;
        if (typeof data === "object" && data !== null && "detail" in data) {
          const d = (data as { detail: unknown }).detail;
          if (typeof d === "string") {
            detail = d;
          } else if (Array.isArray(d)) {
            detail = d
              .map((item) =>
                typeof item === "object" &&
                item !== null &&
                "msg" in item &&
                typeof (item as { msg: unknown }).msg === "string"
                  ? (item as { msg: string }).msg
                  : JSON.stringify(item),
              )
              .join("; ");
          }
        }
        throw new Error(detail);
      }

      const applied =
        data &&
        typeof data === "object" &&
        "applied" in data &&
        typeof (data as { applied: unknown }).applied === "object" &&
        (data as { applied: Record<string, unknown> }).applied !== null
          ? (data as { applied: Record<string, unknown> }).applied
          : {};

      const parts = Object.entries(applied).map(
        ([k, v]) => `${k}: ${String(v)}`,
      );
      setMessage(parts.length ? parts.join(" · ") : "Done.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
        Upload a JSON knowledge pack. It is sent to the API and upserted into{" "}
        <code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-xs">
          kb_services
        </code>
        ,{" "}
        <code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-xs">
          kb_case_studies
        </code>
        ,{" "}
        <code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-xs">
          kb_pricing
        </code>
        , and{" "}
        <code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-xs">
          kb_snippets
        </code>{" "}
        (matched by <code className="font-mono text-xs">slug</code>).{" "}
        <code className="font-mono text-xs">deliverables</code> and{" "}
        <code className="font-mono text-xs">outcomes</code> must be JSON arrays
        of strings. <code className="font-mono text-xs">is_active</code>{" "}
        defaults to <code className="font-mono text-xs">true</code> when
        omitted.
      </p>
      <div className="mt-8 max-w-md">
        <label className="block">
          <span className="text-sm font-medium text-ink">JSON file</span>
          <input
            type="file"
            name="document"
            accept=".json,application/json"
            disabled={busy}
            onChange={(ev) => void onFile(ev)}
            className="mt-2 block w-full cursor-pointer rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>
        {busy ? (
          <p className="mt-3 text-sm text-ink-soft" role="status">
            Importing…
          </p>
        ) : null}
        {message ? (
          <p
            className="mt-3 text-sm font-medium text-emerald-800"
            role="status"
          >
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </>
  );
}
