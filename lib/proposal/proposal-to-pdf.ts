import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import type { ProposalDocument } from "./types";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 50;

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

function wrapLine(
  font: PDFFont,
  text: string,
  maxWidth: number,
  fontSize: number,
): string[] {
  const out: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    if (!paragraph) {
      out.push("");
      continue;
    }
    const words = paragraph.split(/\s+/);
    let current = "";
    for (const word of words) {
      const trial = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(trial, fontSize) <= maxWidth) {
        current = trial;
      } else {
        if (current) out.push(current);
        if (font.widthOfTextAtSize(word, fontSize) <= maxWidth) {
          current = word;
        } else {
          let chunk = "";
          for (const ch of word) {
            const next = chunk + ch;
            if (font.widthOfTextAtSize(next, fontSize) <= maxWidth) chunk = next;
            else {
              if (chunk) out.push(chunk);
              chunk = ch;
            }
          }
          current = chunk;
        }
      }
    }
    if (current) out.push(current);
  }
  return out;
}

/** Server-side PDF bytes. Used by the API route. */
export async function proposalToPdfBuffer(
  proposal: ProposalDocument,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  const maxW = PAGE_W - 2 * MARGIN;
  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const ensureSpace = (neededFromBottom: number) => {
    if (y - neededFromBottom < MARGIN) {
      page = pdf.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  };

  const titleSize = 20;
  const titleLines = wrapLine(boldFont, proposal.title, maxW, titleSize);
  const titleLh = titleSize * 1.35;
  for (const tl of titleLines) {
    ensureSpace(titleLh);
    y -= titleLh;
    page.drawText(tl, {
      x: MARGIN,
      y,
      size: titleSize,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.12),
    });
  }

  const metaSize = 10;
  const metaLh = metaSize * 1.35;
  const meta = `Generated: ${formatGeneratedAt(proposal.generatedAt)}`;
  ensureSpace(metaLh * 2);
  y -= metaLh;
  page.drawText(meta, {
    x: MARGIN,
    y,
    size: metaSize,
    font: bodyFont,
    color: rgb(0.35, 0.35, 0.38),
  });

  const h2Size = 12;
  const bodySize = 11;
  const h2Lh = h2Size * 1.35;
  const bodyLh = bodySize * 1.35;

  for (const section of proposal.sections) {
    ensureSpace(h2Lh + bodyLh);
    y -= h2Lh * 0.5;
    const headLines = wrapLine(boldFont, section.heading, maxW, h2Size);
    for (const hl of headLines) {
      ensureSpace(h2Lh);
      y -= h2Lh;
      page.drawText(hl, {
        x: MARGIN,
        y,
        size: h2Size,
        font: boldFont,
        color: rgb(0.15, 0.15, 0.18),
      });
    }

    const bodyLines = wrapLine(bodyFont, section.body, maxW, bodySize);
    for (const bl of bodyLines) {
      ensureSpace(bodyLh);
      y -= bodyLh;
      page.drawText(bl.length === 0 ? " " : bl, {
        x: MARGIN,
        y,
        size: bodySize,
        font: bodyFont,
        color: rgb(0.12, 0.12, 0.14),
      });
    }
  }

  const bytes = await pdf.save();
  return bytes;
}
