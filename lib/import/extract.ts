import "server-only";

/**
 * Turn an uploaded course document into plain lines, keeping order.
 * - DOCX: mammoth → HTML, so paragraph breaks, list items AND hyperlink targets survive.
 * - PDF:  unpdf (pdf.js) text, page by page.
 * - TXT:  as-is.
 */
export async function extractText(buf: Buffer, filename: string, mime: string): Promise<{ text: string; warnings: string[] }> {
  const name = filename.toLowerCase();
  const warnings: string[] = [];
  if (name.endsWith(".docx") || mime.includes("wordprocessingml")) {
    const mammoth = await import("mammoth");
    const { value, messages } = await mammoth.convertToHtml({ buffer: buf });
    for (const m of messages) if (m.type === "error") warnings.push(m.message);
    return { text: htmlToLines(value), warnings };
  }
  if (name.endsWith(".pdf") || mime === "application/pdf") {
    const { extractText: pdfText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await pdfText(pdf, { mergePages: false });
    const pages = Array.isArray(text) ? text : [text];
    if (!pages.join("").trim()) warnings.push("This PDF has no selectable text (it may be scanned). Export it as DOCX or TXT and try again.");
    return { text: pages.join("\n"), warnings };
  }
  if (name.endsWith(".txt") || mime.startsWith("text/")) return { text: buf.toString("utf8"), warnings };
  if (name.endsWith(".doc")) throw new Error("Old .doc files aren't supported. In Word, use File → Save As → .docx, then upload again.");
  throw new Error("Upload a .docx, .pdf or .txt file.");
}

const ENT: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " };
function decode(s: string) {
  return s.replace(/&(#\d+|#x[\da-f]+|\w+);/gi, (m, e: string) => {
    if (ENT[e]) return ENT[e];
    if (e[0] === "#") return String.fromCodePoint(e[1] === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return m;
  });
}
export function htmlToLines(html: string) {
  return decode(
    html
      // keep link targets that differ from the visible text
      .replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, (_m, href: string, txt: string) => {
        const t = txt.replace(/<[^>]+>/g, "");
        return t.trim() === href.trim() || !/^https?:/i.test(href) ? t || href : `${t} (${href})`;
      })
      .replace(/<li[^>]*>/gi, "\n• ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|h\d|li|tr|div)>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  );
}
