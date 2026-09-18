/**
 * Helper to normalize image paths from 163kCMS database migration & uploads
 */
export function getImageUrl(path: string | null | undefined): string | null {
  if (!path || typeof path !== 'string') return null;
  
  let trimmed = path.trim();
  if (!trimmed) return null;

  // 1. If absolute URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // 2. Clean leading relative prefixes like ../ or ./ or \
  trimmed = trimmed.replace(/^(\.\.\/|\.\/|\\)+/, '');

  // 3. Normalize windows backslashes
  trimmed = trimmed.replace(/\\/g, '/');

  // 4. Ensure leading slash
  if (!trimmed.startsWith('/')) {
    trimmed = '/' + trimmed;
  }

  return trimmed;
}

/**
 * Category Fallback Badges & Colors for items without uploaded photos
 */
export const CATEGORY_FALLBACK_STYLES: Record<string, { bg: string; icon: string; label: string }> = {
  food: { bg: "linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)", icon: "🍜", label: "餐饮美食" },
  hotel: { bg: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)", icon: "🏨", label: "酒店住宿" },
  service: { bg: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)", icon: "🛠", label: "生活服务" },
  digital: { bg: "linear-gradient(135deg, #4e54c8 0%, #8f94fb 100%)", icon: "🖥", label: "电脑数码" },
  monitor: { bg: "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)", icon: "📹", label: "安防监控" },
  car: { bg: "linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)", icon: "🚗", label: "汽车服务" },
  decorate: { bg: "linear-gradient(135deg, #f857a6 0%, #ff5858 100%)", icon: "🏠", label: "装修建材" },
  beauty: { bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", icon: "💄", label: "美容美发" },
  education: { bg: "linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)", icon: "🎓", label: "教育培训" },
  express: { bg: "linear-gradient(135deg, #00B4DB 0%, #0083B0 100%)", icon: "📦", label: "快递物流" },
  default: { bg: "linear-gradient(135deg, #0b7a75 0%, #075e5a 100%)", icon: "🏪", label: "本地好店" },
};
