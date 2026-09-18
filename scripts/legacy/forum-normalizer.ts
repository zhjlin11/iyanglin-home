export interface RawForumInput {
  index: number;
  title: string;
  board?: string;
  body?: string;
  images?: string[];
  isTop?: boolean;
}

export interface NormalizedForumRecord {
  oldId: string;
  title: string;
  board: string; // yanglin | news | help | life
  body: string;
  images: string[];
  status: "APPROVED" | "PENDING";
  isTop: boolean;
}

export function normalizeForumRecord(raw: RawForumInput): NormalizedForumRecord {
  const indexStr = String(raw.index).padStart(3, "0");
  const oldId = `LEGACY_FORUM_0723_${indexStr}`;

  // 1. Standardize board category
  let board = "yanglin";
  const rawBoard = (raw.board || raw.title || "").toLowerCase();
  if (rawBoard.includes("新闻") || rawBoard.includes("动态") || rawBoard.includes("公告") || rawBoard.includes("通告")) {
    board = "news";
  } else if (rawBoard.includes("求助") || rawBoard.includes("问答") || rawBoard.includes("打听") || rawBoard.includes("咨询")) {
    board = "help";
  } else if (rawBoard.includes("生活") || rawBoard.includes("闲聊") || rawBoard.includes("美食") || rawBoard.includes("吐槽")) {
    board = "life";
  }

  // 2. Standardize title & body
  const title = raw.title.trim();
  const body = raw.body?.trim() || `${title}。欢迎广大杨林居民与大学城同学踊跃留言讨论交流！`;

  return {
    oldId,
    title,
    board,
    body,
    images: raw.images || [],
    status: "APPROVED",
    isTop: Boolean(raw.isTop),
  };
}
