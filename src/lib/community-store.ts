import { prisma } from "@/lib/prisma";
import { ContentStatus } from "@prisma/client";
import { extractImageUrls } from "@/lib/strip-html";

export type PostCommentItem = {
  id: string;
  postId: string;
  parentId?: string | null;
  content: string;
  createdAt: string;
  likesCount: number;
  isFeatured: boolean;
  authorId?: string;
  authorName?: string;
  authorAvatar?: string | null;
  authorBadge?: string | null;
  replies?: PostCommentItem[];
};

export type CommunityPostItem = {
  id: string;
  kind: "post";
  title: string;
  board: string; // yanglin | news | help | life | college | trade
  category: string; // share | help | trade | news | topic | yanglin | college
  body: string;
  status: string;
  isTop: boolean;
  isFeatured: boolean;
  resolvedStatus: string; // OPEN | RESOLVED
  viewsCount: number;
  repliesCount: number;
  likesCount: number;
  favoritesCount: number;
  topics: string[];
  createdAt: string;
  authorId?: string;
  authorName?: string;
  authorAvatar?: string | null;
  authorBadge?: string | null;
  images: string[];
  comments: PostCommentItem[];
  oldId?: string | null;
  isLiked?: boolean;
};

const statusValue = (status: string) => status.toUpperCase() as ContentStatus;

const mapComment = (c: any): PostCommentItem => ({
  id: c.id,
  postId: c.postId,
  parentId: c.parentId || null,
  content: c.content || "",
  createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
  likesCount: c.likesCount || 0,
  isFeatured: Boolean(c.isFeatured),
  authorId: c.authorId || undefined,
  authorName: c.author?.nickname || c.author?.username || "热心网友",
  authorAvatar: c.author?.avatar || c.author?.wechatAvatar || null,
  authorBadge: c.author?.communityBadge || null,
  replies: c.replies ? c.replies.map(mapComment) : [],
});

const mapPost = (item: any, currentUserId?: string): CommunityPostItem => {
  const allComments = (item.comments || []).map(mapComment);
  const commentMap = new Map<string, PostCommentItem>();
  const topLevelComments: PostCommentItem[] = [];

  allComments.forEach((c: PostCommentItem) => {
    commentMap.set(c.id, { ...c, replies: [] });
  });

  allComments.forEach((c: PostCommentItem) => {
    const commentObj = commentMap.get(c.id)!;
    if (c.parentId && commentMap.has(c.parentId)) {
      commentMap.get(c.parentId)!.replies!.push(commentObj);
    } else {
      topLevelComments.push(commentObj);
    }
  });

  const isLiked = currentUserId && item.likes && Array.isArray(item.likes)
    ? item.likes.some((l: any) => l.userId === currentUserId)
    : false;

  let postImages = item.images && Array.isArray(item.images) && item.images.length > 0 ? item.images : [];
  if (postImages.length === 0 && item.body) {
    postImages = extractImageUrls(item.body);
  }

  // 避免所有用户都 fallback 为一模一样的“热心网友”
  const fallbackAuthor = item.authorId
    ? `杨林街坊_${item.authorId.slice(-4)}`
    : `街坊_${(item.id || "").slice(-4)}`;
  const authorName = item.author?.nickname || item.author?.username || fallbackAuthor;

  return {
    id: item.id,
    kind: "post",
    title: item.title,
    board: item.board || "yanglin",
    category: item.category || "share",
    body: item.body,
    status: item.status ? item.status.toLowerCase() : "draft",
    isTop: Boolean(item.isTop),
    isFeatured: Boolean(item.isFeatured),
    resolvedStatus: item.resolvedStatus || "OPEN",
    viewsCount: item.viewsCount || 0,
    repliesCount: item.comments ? item.comments.length : (item.repliesCount || 0),
    likesCount: item.likesCount || 0,
    favoritesCount: item.favoritesCount || 0,
    topics: item.topics || [],
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
    authorId: item.authorId || undefined,
    authorName,
    authorAvatar: item.author?.avatar || item.author?.wechatAvatar || null,
    authorBadge: item.author?.communityBadge || null,
    images: postImages,
    comments: topLevelComments,
    oldId: item.oldId,
    isLiked,
  };
};

export async function getPost(id: string, currentUserId?: string): Promise<CommunityPostItem | null> {
  let item = await prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          username: true,
          nickname: true,
          avatar: true,
          wechatAvatar: true,
          communityBadge: true,
        },
      },
      comments: {
        include: {
          author: {
            select: {
              username: true,
              nickname: true,
              avatar: true,
              wechatAvatar: true,
              communityBadge: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      likes: currentUserId ? { where: { userId: currentUserId }, select: { userId: true } } : false,
    },
  });

  if (!item) {
    item = await prisma.post.findFirst({
      where: { oldId: id },
      include: {
        author: {
          select: {
            username: true,
            nickname: true,
            avatar: true,
            wechatAvatar: true,
            communityBadge: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                username: true,
                nickname: true,
                avatar: true,
                wechatAvatar: true,
                communityBadge: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        likes: currentUserId ? { where: { userId: currentUserId }, select: { userId: true } } : false,
      },
    });
  }

  if (!item) return null;

  await prisma.post.update({
    where: { id: item.id },
    data: { viewsCount: { increment: 1 } },
  }).catch(() => {});

  return mapPost(item, currentUserId);
}

export async function listPosts(options?: {
  board?: string;
  category?: string;
  topic?: string;
  status?: string;
  authorId?: string;
  search?: string;
  sort?: "recommend" | "latest" | "hot" | "featured" | "unanswered";
  currentUserId?: string;
  limit?: number;
}) {
  const where: any = {};
  if (options?.board && options.board !== "all") where.board = options.board;
  if (options?.category && options.category !== "all") where.category = options.category;
  if (options?.topic) where.topics = { has: options.topic };
  if (options?.status) where.status = statusValue(options.status);
  if (options?.authorId) where.authorId = options.authorId;
  if (options?.sort === "featured") where.isFeatured = true;
  if (options?.sort === "unanswered") {
    where.resolvedStatus = "OPEN";
    where.board = "help";
  }

  if (options?.search) {
    where.OR = [
      { title: { contains: options.search, mode: "insensitive" } },
      { body: { contains: options.search, mode: "insensitive" } },
      { author: { nickname: { contains: options.search, mode: "insensitive" } } },
      { author: { username: { contains: options.search, mode: "insensitive" } } },
    ];
  }

  let orderBy: any = [{ isTop: "desc" }, { createdAt: "desc" }];
  if (options?.sort === "hot") {
    orderBy = [{ isTop: "desc" }, { viewsCount: "desc" }, { repliesCount: "desc" }, { createdAt: "desc" }];
  }

  const items = await prisma.post.findMany({
    where,
    include: {
      author: {
        select: {
          username: true,
          nickname: true,
          avatar: true,
          wechatAvatar: true,
          communityBadge: true,
        },
      },
      likes: options?.currentUserId ? { where: { userId: options.currentUserId }, select: { userId: true } } : false,
    },
    orderBy,
    take: options?.limit || 200,
  });

  const mapped = items.map((it) => mapPost(it, options?.currentUserId));

  // 如果是“推荐”排序，执行时间衰减 + 热度综合算法 (HackerNews 算法变体)
  if (options?.sort === "recommend" || !options?.sort) {
    const now = Date.now();
    return mapped.sort((a, b) => {
      // 置顶始终优先
      if (a.isTop && !b.isTop) return -1;
      if (!a.isTop && b.isTop) return 1;

      // 时间衰减计算 (以小时为单位)
      const ageHoursA = Math.max(1, (now - new Date(a.createdAt).getTime()) / (1000 * 3600));
      const ageHoursB = Math.max(1, (now - new Date(b.createdAt).getTime()) / (1000 * 3600));

      // 综合互动分 = 浏览 * 0.1 + 点赞 * 2 + 回复 * 5 + 精选权重(10)
      const scoreA = (a.viewsCount * 0.1) + (a.likesCount * 2) + (a.repliesCount * 5) + (a.isFeatured ? 15 : 0) + 5;
      const scoreB = (b.viewsCount * 0.1) + (b.likesCount * 2) + (b.repliesCount * 5) + (b.isFeatured ? 15 : 0) + 5;

      // 越新的内容越容易排在前面 (除以时间衰减幂次)
      const rankA = scoreA / Math.pow(ageHoursA + 2, 1.2);
      const rankB = scoreB / Math.pow(ageHoursB + 2, 1.2);

      return rankB - rankA;
    });
  }

  return mapped;
}

export async function createPost(input: {
  title: string;
  board?: string;
  category?: string;
  body: string;
  status: string;
  authorId?: string;
  images?: string[];
  topics?: string[];
  oldId?: string;
}, tx?: any) {
  const db = tx || prisma;
  const status = statusValue(input.status);
  const item = await db.post.create({
    data: {
      title: input.title,
      board: input.board || "yanglin",
      category: input.category || "share",
      body: input.body,
      status,
      authorId: input.authorId,
      images: input.images || [],
      topics: input.topics || [],
      oldId: input.oldId,
    },
    include: {
      author: {
        select: {
          username: true,
          nickname: true,
          avatar: true,
          wechatAvatar: true,
          communityBadge: true,
        },
      },
      comments: true,
    },
  });

  if (input.topics && input.topics.length > 0) {
    for (const slug of input.topics) {
      await db.topic.upsert({
        where: { slug },
        create: {
          slug,
          name: slug,
          postsCount: 1,
        },
        update: {
          postsCount: { increment: 1 },
        },
      }).catch(() => {});
    }
  }

  await db.operationLog.create({
    data: {
      userId: input.authorId,
      action: `CREATE_POST_${status}`,
      targetId: item.id,
      metadata: { title: item.title, board: item.board, category: item.category },
    },
  });

  return mapPost(item);
}

export async function createPostComment(input: {
  postId: string;
  content: string;
  authorId?: string;
  parentId?: string;
}) {
  const comment = await prisma.postComment.create({
    data: {
      postId: input.postId,
      parentId: input.parentId || null,
      content: input.content,
      authorId: input.authorId,
    },
    include: {
      author: {
        select: {
          username: true,
          nickname: true,
          avatar: true,
          wechatAvatar: true,
          communityBadge: true,
        },
      },
    },
  });

  await prisma.post.update({
    where: { id: input.postId },
    data: { repliesCount: { increment: 1 } },
  }).catch(() => {});

  return mapComment(comment);
}

export async function togglePostLike(postId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
  const existing = await prisma.postLike.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    await prisma.postLike.delete({
      where: { id: existing.id },
    });
    const updated = await prisma.post.update({
      where: { id: postId },
      data: { likesCount: { decrement: 1 } },
      select: { likesCount: true },
    });
    return { liked: false, likesCount: Math.max(0, updated.likesCount) };
  } else {
    await prisma.postLike.create({
      data: { userId, postId },
    });
    const updated = await prisma.post.update({
      where: { id: postId },
      data: { likesCount: { increment: 1 } },
      select: { likesCount: true },
    });
    return { liked: true, likesCount: updated.likesCount };
  }
}

export async function updatePost(
  id: string,
  status: string,
  fields?: {
    title?: string;
    board?: string;
    category?: string;
    body?: string;
    images?: string[];
    topics?: string[];
    isTop?: boolean;
    isFeatured?: boolean;
    resolvedStatus?: string;
  },
) {
  const value = statusValue(status);
  const updated = await prisma.post.update({
    where: { id },
    data: {
      status: value,
      ...(fields?.title !== undefined ? { title: fields.title } : {}),
      ...(fields?.board !== undefined ? { board: fields.board } : {}),
      ...(fields?.category !== undefined ? { category: fields.category } : {}),
      ...(fields?.body !== undefined ? { body: fields.body } : {}),
      ...(fields?.images !== undefined ? { images: fields.images } : {}),
      ...(fields?.topics !== undefined ? { topics: fields.topics } : {}),
      ...(fields?.isTop !== undefined ? { isTop: fields.isTop } : {}),
      ...(fields?.isFeatured !== undefined ? { isFeatured: fields.isFeatured } : {}),
      ...(fields?.resolvedStatus !== undefined ? { resolvedStatus: fields.resolvedStatus } : {}),
    },
    include: {
      author: {
        select: {
          username: true,
          nickname: true,
          avatar: true,
          wechatAvatar: true,
          communityBadge: true,
        },
      },
      comments: true,
    },
  });

  await prisma.operationLog.create({
    data: {
      action: `UPDATE_POST_${value}`,
      targetId: updated.id,
      metadata: { title: updated.title },
    },
  });

  return mapPost(updated);
}
