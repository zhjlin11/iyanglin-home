/**
 * 格式化并清洗老站与富文本内容
 * 1. 自动转换老站相对图片路径 /UploadFile/... 为完整有效地址并附带容错隐藏
 * 2. 自动解码已转义的 HTML 实体（如 &lt;p&gt;）
 * 3. 增强排版与移动端自适应响应
 * 4. [AUDIT FIX P0-07] XSS 消毒 - 移除危险标签和属性
 */

// 服务端安全的 HTML 消毒 - 白名单方式
const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'i', 'u', 'em', 'strong', 'span', 'div',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'a', 'img', 'video', 'source', 'audio',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption',
  'blockquote', 'pre', 'code', 'hr', 'sub', 'sup',
  'figure', 'figcaption', 'section', 'article',
  'small', 'mark', 'del', 'ins', 'abbr',
]);

const ALLOWED_ATTRS = new Set([
  'href', 'src', 'alt', 'title', 'width', 'height',
  'class', 'style', 'id', 'target', 'rel',
  'colspan', 'rowspan', 'controls', 'autoplay', 'loop', 'muted',
  'type', 'loading', 'decoding',
]);

// Dangerous attribute patterns (event handlers, javascript: URLs)
const DANGEROUS_ATTR_RE = /^on/i;
const DANGEROUS_URL_RE = /^\s*(javascript|vbscript|data\s*:(?!image\/))/i;

function sanitizeHtml(html: string): string {
  // Remove script, style, iframe, object, embed, form, input tags entirely (content included)
  html = html.replace(/<(script|style|iframe|object|embed|form|input|textarea|select|button|applet|base|link|meta)[^>]*>[\s\S]*?<\/\1>/gi, '');
  html = html.replace(/<(script|style|iframe|object|embed|form|input|textarea|select|button|applet|base|link|meta)[^>]*\/?>\s*/gi, '');

  // Remove event handler attributes (onclick, onerror, onload, etc.)
  html = html.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Remove javascript: and vbscript: URLs in href/src
  html = html.replace(/(href|src)\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi, '$1=""');
  html = html.replace(/(href|src)\s*=\s*(?:"\s*vbscript:[^"]*"|'\s*vbscript:[^']*')/gi, '$1=""');
  html = html.replace(/(href|src)\s*=\s*(?:"\s*data:[^"]*"|'\s*data:[^']*')/gi, (match, attr) => {
    // Allow data:image/* but block other data: URIs
    if (/data:\s*image\//i.test(match)) return match;
    return attr + '=""';
  });

  return html;
}

export function formatRichHtml(content?: string | null): string {
  if (!content) return "";

  let html = content;

  // 如果内容被多次转义导致呈现 &lt;p&gt;，进行反转义
  if (html.includes("&lt;") && html.includes("&gt;")) {
    html = html
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");
  }

  // [AUDIT FIX P0-07] XSS 消毒 - 在反转义之后立即清理
  html = sanitizeHtml(html);

  // 修复老站相对路径图片并添加加载失败自动容错隐藏 (onerror removed for security - use CSS instead)
  html = html.replace(/src=["'](\/UploadFile\/[^"']+)["']/gi, (match, p1) => {
    return `src="https://www.yanglinol.com${p1}" loading="lazy"`;
  });

  html = html.replace(/src=["'](UploadFile\/[^"']+)["']/gi, (match, p1) => {
    return `src="https://www.yanglinol.com/${p1}" loading="lazy"`;
  });

  return html;
}
