"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface CardItem {
  id: string;
  title: string;
  subTitle?: string;
  tag?: string;
  priceText?: string;
  coverImage?: string;
  link: string;
  channel: string;
}

interface Group {
  groupTitle: string;
  channelName: string;
  items: CardItem[];
}

interface Props {
  targetType: "INDUSTRIAL" | "JOB" | "HOUSE" | "PROVIDER";
  targetId: string;
  area?: string;
  className?: string;
}

export default function CrossChannelRecommendations({
  targetType,
  targetId,
  area,
  className = "",
}: Props) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const query = new URLSearchParams({
          targetType,
          targetId,
          area: area || "杨林",
        });
        const res = await fetch(`/api/recommendations/cross-channel?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.groups) {
            setGroups(data.groups);
          }
        }
      } catch (err) {
        console.error("Failed to load cross-channel recommendations:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [targetType, targetId, area]);

  if (loading) {
    return (
      <div className={`my-8 p-6 bg-slate-50/80 rounded-2xl border border-slate-100 ${className}`}>
        <div className="h-6 w-48 bg-slate-200 rounded animate-pulse mb-6"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-white rounded-xl shadow-sm p-4 animate-pulse">
              <div className="h-20 bg-slate-100 rounded-lg mb-3"></div>
              <div className="h-4 bg-slate-200 rounded mb-2"></div>
              <div className="h-3 w-2/3 bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (groups.length === 0) return null;

  return (
    <div className={`my-8 space-y-8 ${className}`}>
      {groups.map((group, idx) => {
        if (!group.items || group.items.length === 0) return null;
        return (
          <section
            key={idx}
            className="p-5 md:p-6 bg-gradient-to-br from-slate-50 to-emerald-50/20 rounded-2xl border border-slate-200/70 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 bg-emerald-600 rounded-full"></span>
                <h3 className="text-base md:text-lg font-bold text-slate-800">
                  {group.groupTitle}
                </h3>
              </div>
              <span className="text-xs px-2 py-0.5 bg-emerald-100/70 text-emerald-800 font-medium rounded-full">
                平台智能联动 · {group.channelName}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {group.items.map((item) => (
                <Link
                  key={item.id}
                  href={item.link}
                  className="group bg-white rounded-xl p-3.5 border border-slate-200/80 hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {item.coverImage ? (
                      <div className="relative w-full h-24 rounded-lg overflow-hidden mb-2.5 bg-slate-100">
                        <img
                          src={item.coverImage}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {item.tag && (
                          <span className="absolute top-1.5 left-1.5 text-[10px] px-1.5 py-0.5 bg-black/60 text-white backdrop-blur-sm rounded">
                            {item.tag}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-10 flex items-center mb-2">
                        {item.tag && (
                          <span className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-medium rounded">
                            {item.tag}
                          </span>
                        )}
                      </div>
                    )}

                    <h4 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-snug mb-1">
                      {item.title}
                    </h4>

                    {item.subTitle && (
                      <p className="text-xs text-slate-500 line-clamp-1 mb-2">
                        {item.subTitle}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between mt-1">
                    {item.priceText ? (
                      <span className="text-xs font-bold text-rose-600">
                        {item.priceText}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">查看详情</span>
                    )}
                    <span className="text-xs text-emerald-600 font-medium group-hover:translate-x-0.5 transition-transform">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
