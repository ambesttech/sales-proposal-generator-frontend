import { NextResponse } from "next/server";
import type { ProposalDocument } from "@/lib/proposal/types";

export const runtime = "nodejs";

function isProposalDocument(value: unknown): value is ProposalDocument {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.title === "string" &&
    Array.isArray(o.sections) &&
    typeof o.generatedAt === "string" &&
    o.sections.every(
      (s) =>
        s &&
        typeof s === "object" &&
        typeof (s as { heading?: unknown }).heading === "string" &&
        typeof (s as { body?: unknown }).body === "string",
    )
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const proposal =
    body && typeof body === "object" && "proposal" in body
      ? (body as { proposal: unknown }).proposal
      : null;

  if (!isProposalDocument(proposal)) {
    return Response.json({ error: "Missing or invalid proposal" }, { status: 400 });
  }

  try {
    const { proposalToDocxBuffer } = await import(
      "@/lib/proposal/proposal-to-docx"
    );
    const buffer = await proposalToDocxBuffer(proposal);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="proposal.docx"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[api/proposals/docx]", err);
    const message =
      err instanceof Error ? err.message : "Failed to build Word document";
    return NextResponse.json(
      {
        error: "Failed to build Word document",
        ...(process.env.NODE_ENV === "development" && { detail: message }),
      },
      { status: 500 },
    );
  }
}
