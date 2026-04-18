import type { ProposalDocument } from "./types";

export const PROPOSALS_CATALOG_CHANGED_EVENT = "proposals-catalog-changed";

export function notifyProposalsCatalogChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PROPOSALS_CATALOG_CHANGED_EVENT));
  }
}

function apiV1Base(): string {
  const publicBase =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
  return publicBase ? `${publicBase}/api/v1` : "/api/v1";
}

export type ProposalListItem = {
  id: string;
  status: string;
  title: string;
  clientName: string;
  updatedAt: string;
};

export type ProposalDetailResponse = {
  id: string;
  status: string;
  clientName: string;
  title: string;
  proposal: ProposalDocument | null;
  updatedAt: string;
};

export async function fetchProposalsList(
  userId: string,
  limit = 100,
): Promise<ProposalListItem[]> {
  const q = new URLSearchParams({
    userId: userId.trim(),
    limit: String(limit),
  });
  const res = await fetch(`${apiV1Base()}/proposals?${q}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) {
    throw new Error("Invalid proposals response.");
  }
  return data.map((row) => {
    const o = row as Record<string, unknown>;
    return {
      id: String(o.id ?? ""),
      status: String(o.status ?? ""),
      title: String(o.title ?? ""),
      clientName: String(o.clientName ?? ""),
      updatedAt: String(o.updatedAt ?? ""),
    };
  });
}

export async function fetchProposalDetail(
  id: string,
  userId: string,
): Promise<ProposalDetailResponse | null> {
  const q = new URLSearchParams({ userId: userId.trim() });
  const res = await fetch(
    `${apiV1Base()}/proposals/${encodeURIComponent(id)}?${q}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    if (res.status === 404) return null;
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }
  const o = (await res.json()) as Record<string, unknown>;
  const proposalRaw = o.proposal;
  let proposal: ProposalDocument | null = null;
  if (
    proposalRaw &&
    typeof proposalRaw === "object" &&
    proposalRaw !== null &&
    "sections" in proposalRaw &&
    Array.isArray((proposalRaw as ProposalDocument).sections)
  ) {
    proposal = proposalRaw as ProposalDocument;
  }
  return {
    id: String(o.id ?? ""),
    status: String(o.status ?? ""),
    clientName: String(o.clientName ?? ""),
    title: String(o.title ?? ""),
    proposal,
    updatedAt: String(o.updatedAt ?? ""),
  };
}

export async function deleteProposal(
  id: string,
  userId: string,
): Promise<void> {
  const q = new URLSearchParams({ userId: userId.trim() });
  const res = await fetch(
    `${apiV1Base()}/proposals/${encodeURIComponent(id)}?${q}`,
    {
      method: "DELETE",
      cache: "no-store",
    },
  );
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Proposal not found.");
    }
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }
}
