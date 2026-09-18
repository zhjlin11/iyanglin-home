export function cleanText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export function stripHtml(html: string): string {
  if (!html) return "";
  return cleanText(
    html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]*>/g, " ")
      .replace(/<[^>]*$/g, " ")
      .replace(/&ldquo;/g, "“")
      .replace(/&rdquo;/g, "”")
      .replace(/&lsquo;/g, "‘")
      .replace(/&rsquo;/g, "’")
      .replace(/&mdash;/g, "—")
      .replace(/&ndash;/g, "–")
      .replace(/&hellip;/g, "…")
      .replace(/&bull;/g, "•")
      .replace(/&middot;/g, "·")
      .replace(/&copy;/g, "©")
      .replace(/&reg;/g, "®")
      .replace(/&times;/g, "×")
      .replace(/&divide;/g, "÷")
      .replace(/&[a-zA-Z]+;/g, " ")
      .replace(/\s+/g, " ")
  );
}

export function extractImageUrls(html: string): string[] {
  if (!html) return [];
  const urls: string[] = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    if (src && !src.includes("data:image") && !src.includes("icon") && !urls.includes(src)) {
      urls.push(src);
    }
  }
  return urls;
}
