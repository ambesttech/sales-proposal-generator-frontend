import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { ProposalDocument } from "./types";

function formatGeneratedAt(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function bodyToParagraphs(body: string): Paragraph[] {
  const lines = body.split(/\r?\n/);
  return lines.map(
    (line) =>
      new Paragraph({
        children: [new TextRun(line.length === 0 ? "\u00A0" : line)],
        spacing: { after: 120 },
      }),
  );
}

/** Server-side (.docx bytes). Used by the API route — keeps `docx` out of the client bundle. */
export async function proposalToDocxBuffer(
  proposal: ProposalDocument,
): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      text: proposal.title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated: ${formatGeneratedAt(proposal.generatedAt)}`,
          italics: true,
        }),
      ],
      spacing: { after: 360 },
    }),
  ];

  for (const section of proposal.sections) {
    children.push(
      new Paragraph({
        text: section.heading,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      }),
    );
    children.push(...bodyToParagraphs(section.body));
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
