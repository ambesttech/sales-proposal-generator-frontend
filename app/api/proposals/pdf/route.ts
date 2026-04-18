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
    const { proposalToPdfBuffer } = await import("@/lib/proposal/proposal-to-pdf");
    const bytes = await proposalToPdfBuffer(proposal);
    const pdfBuffer = Buffer.from(bytes);
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="proposal.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[api/proposals/pdf]", err);
    const message =
      err instanceof Error ? err.message : "Failed to build PDF";
    return NextResponse.json(
      {
        error: "Failed to build PDF",
        ...(process.env.NODE_ENV === "development" && { detail: message }),
      },
      { status: 500 },
    );
  }
}
