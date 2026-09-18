"use client";

export interface BookmarkItem {
  id: string;
  kind: "listing" | "house" | "shop" | "event" | "job" | "love" | "community" | "article";
  title: string;
  url: string;
  createdAt: string;
}

const STORAGE_KEY = "yanglin_user_bookmarks_v1";

export function getBookmarks(): BookmarkItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function isBookmarked(id: string): boolean {
  const list = getBookmarks();
  return list.some((item) => item.id === id);
}

export function toggleBookmark(item: BookmarkItem): boolean {
  if (typeof window === "undefined") return false;
  const list = getBookmarks();
  const index = list.findIndex((i) => i.id === item.id);
  
  let newList: BookmarkItem[];
  let added = false;

  if (index >= 0) {
    newList = list.filter((i) => i.id !== item.id);
    added = false;
  } else {
    newList = [item, ...list];
    added = true;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
  } catch (e) {}

  return added;
}
