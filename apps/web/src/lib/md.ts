const esc = (s: unknown): string =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    (({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }) as Record<string, string>)[c],
  );

/** Minimal, safe markdown → HTML (escapes first, then applies a small subset). */
export function md(t: string): string {
  const inl = (x: string) =>
    x.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>");
  let out = "";
  let list: "ul" | "ol" | null = null;
  const close = () => {
    if (list) {
      out += `</${list}>`;
      list = null;
    }
  };
  for (const raw of esc(t).split("\n")) {
    const l = raw.trimEnd();
    let m: RegExpMatchArray | null;
    if ((m = l.match(/^\s*[-*]\s+(.*)/))) {
      if (list !== "ul") {
        close();
        out += "<ul>";
        list = "ul";
      }
      out += `<li>${inl(m[1])}</li>`;
    } else if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) {
      if (list !== "ol") {
        close();
        out += "<ol>";
        list = "ol";
      }
      out += `<li>${inl(m[1])}</li>`;
    } else if ((m = l.match(/^#{1,4}\s+(.*)/))) {
      close();
      out += `<h4>${inl(m[1])}</h4>`;
    } else if (!l.trim()) {
      close();
    } else {
      close();
      out += `<p>${inl(l)}</p>`;
    }
  }
  close();
  return out;
}

export const escapeHtml = esc;
