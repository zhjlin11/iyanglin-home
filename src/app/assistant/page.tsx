"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  Bot,
  Send,
  Sparkles,
  RotateCcw,
  Trash2,
  MapPin,
  Briefcase,
  Home,
  Wrench,
  Building2,
  Car,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  MessageSquare,
  Plus,
  MoreVertical,
  Edit2,
  Menu,
  X,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Square,
} from "lucide-react";

interface SearchSource {
  type: "job" | "house" | "industrial" | "service" | "provider" | "shop" | "listing";
  id: string;
  title: string;
  url: string;
  priceOrSalary?: string;
  location?: string;
  metaBadge?: string;
  companyOrPublisher?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: SearchSource[];
  totalMatches?: number;
  channelLink?: {
    channelName: string;
    url: string;
    buttonText?: string;
  };
  suggestedFollowUps?: string[];
  status?: "sending" | "success" | "error";
  failedQuery?: string;
}

interface ConversationItem {
  id: string;
  title: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

const INITIAL_PROMPTS = [
  "经开区月薪5000+包吃住招聘",
  "大学城附近独立单间租房",
  "上门维修水电疏通水管师傅",
  "经开区标准厂房带行车出租",
  "杨林到昆明拼车顺风车队",
  "职教城附近有什么特色美食",
];

const SCENARIO_CARDS = [
  {
    icon: Briefcase,
    iconColor: "#0B7A75",
    iconBg: "#E6F4F3",
    title: "经开区急招岗位",
    desc: "普工、机修、两班倒包吃住工作",
    prompt: "帮我找经开区月薪5000以上包吃住的工作",
  },
  {
    icon: Home,
    iconColor: "#D97706",
    iconBg: "#FEF3C7",
    title: "大学城周边租房",
    desc: "文理学院/师大精装单间、合租",
    prompt: "大学城精装单间带阳台，租金600左右",
  },
  {
    icon: Building2,
    iconColor: "#2563EB",
    iconBg: "#DBEAFE",
    title: "园区标准厂房",
    desc: "1000平米车间、带行车库房出租",
    prompt: "杨林经开区标准厂房出租，面积1000平米左右",
  },
  {
    icon: Wrench,
    iconColor: "#7C3AED",
    iconBg: "#F5F3FF",
    title: "上门维修水电",
    desc: "水管角阀漏水、电路跳闸、管道疏通",
    prompt: "家里水管角阀漏水，找个同城水电工师傅",
  },
  {
    icon: Car,
    iconColor: "#059669",
    iconBg: "#D1FAE5",
    title: "杨林到昆明拼车",
    desc: "北部客运站、长水机场顺路车队",
    prompt: "杨林到昆明顺风拼车电话和车队信息",
  },
  {
    icon: ShoppingBag,
    iconColor: "#EA580C",
    iconBg: "#FFEDD5",
    title: "杨林特色美食好店",
    desc: "酸菜牛肉、职教城夜市、聚餐农家乐",
    prompt: "杨林职教新城附近有什么口碑特色美食餐馆",
  },
];

const GUEST_STORAGE_KEY = "yanglin_ai_guest_session_v5";

export default function AssistantWorkspacePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // 移动端安全返回或回退首页
  const handleMobileBack = () => {
    if (typeof window !== "undefined") {
      if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
        window.history.back();
        setTimeout(() => {
          window.location.href = "/";
        }, 350);
        return;
      }
      window.location.href = "/";
    }
  };

  // 会话列表与当前活跃会话
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // 输入与发送状态
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingPhase, setSubmittingPhase] = useState<"understanding" | "retrieving" | "organizing">("understanding");

  // 移动端 Drawer 展开状态
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // 顶部操作菜单更多展开
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [menuOpenConvId, setMenuOpenConvId] = useState<string | null>(null);

  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<{ [msgId: string]: "up" | "down" }>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 1. 初始化检查登录态
  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setIsAuthChecked(true));
  }, []);

  // 2. 加载会话列表
  const fetchConversations = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/ai/conversations");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.conversations) ? data.conversations : [];
        setConversations(list);

        if (!activeConversationId && list.length > 0) {
          loadConversationDetail(list[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    } else if (isAuthChecked && !currentUser) {
      try {
        const saved = localStorage.getItem(GUEST_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
            setMessages(parsed.messages);
            if (Array.isArray(parsed.conversations) && parsed.conversations.length > 0) {
              setConversations(parsed.conversations);
            }
          }
        }
      } catch (e) {
        console.warn("Failed to load guest history", e);
      }
    }
  }, [currentUser, isAuthChecked]);

  // 3. 加载指定会话的消息历史
  const loadConversationDetail = async (convId: string) => {
    setActiveConversationId(convId);
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/ai/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        const rawMsgs = Array.isArray(data.conversation?.messages) ? data.conversation.messages : [];
        const formatted: ChatMessage[] = rawMsgs.map((m: any) => {
          let sources: SearchSource[] = [];
          let channelLink: any = undefined;
          let totalMatches: number | undefined = undefined;
          let suggestedFollowUps: string[] | undefined = undefined;

          try {
            if (m.sourcesJson) {
              const parsed = typeof m.sourcesJson === "string" ? JSON.parse(m.sourcesJson) : m.sourcesJson;
              if (Array.isArray(parsed)) sources = parsed;
              else if (parsed && parsed.sources) sources = parsed.sources;
            }
          } catch {}

          try {
            if (m.metadataJson) {
              const meta = typeof m.metadataJson === "string" ? JSON.parse(m.metadataJson) : m.metadataJson;
              if (meta.channelLink) channelLink = meta.channelLink;
              if (typeof meta.totalMatches === "number") totalMatches = meta.totalMatches;
              if (Array.isArray(meta.suggestedFollowUps)) suggestedFollowUps = meta.suggestedFollowUps;
            }
          } catch {}

          return {
            id: m.id,
            role: m.role === "USER" || m.role === "user" ? "user" : "assistant",
            content: m.content,
            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            sources,
            totalMatches,
            channelLink,
            suggestedFollowUps,
            status: "success",
          };
        });
        setMessages(formatted);
      }
    } catch (err) {
      console.error("Failed to load conversation messages:", err);
    } finally {
      setIsLoadingMessages(false);
      setIsMobileDrawerOpen(false);
    }
  };

  // 4. 游客消息同步持久化到 LocalStorage
  useEffect(() => {
    if (!currentUser && isAuthChecked) {
      try {
        if (messages.length === 0) {
          localStorage.removeItem(GUEST_STORAGE_KEY);
        } else {
          localStorage.setItem(
            GUEST_STORAGE_KEY,
            JSON.stringify({
              messages,
              conversations,
              updatedAt: Date.now(),
            })
          );
        }
      } catch (e) {
        console.warn("Failed to save guest history", e);
      }
    }
  }, [messages, conversations, currentUser, isAuthChecked]);

  // 仅滚动聊天列表容器自身，绝对不滚动外部 window
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    if (messages.length > 0 || isSubmitting) {
      scrollToBottom();
    }
  }, [messages.length, isSubmitting]);

  // 动态渐进思考反馈定时器
  useEffect(() => {
    let t1: NodeJS.Timeout;
    let t2: NodeJS.Timeout;
    if (isSubmitting) {
      setSubmittingPhase("understanding");
      t1 = setTimeout(() => setSubmittingPhase("retrieving"), 500);
      t2 = setTimeout(() => setSubmittingPhase("organizing"), 1200);
    }
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isSubmitting]);

  const abortControllerRef = useRef<AbortController | null>(null);

  // 终止/取消当前正在进行的 AI 响应
  const handleAbort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSubmitting(false);
  };

  // 输入框自适应高度 (默认 48px，最大 130px)
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "46px";
      const nextH = Math.min(Math.max(textareaRef.current.scrollHeight, 46), 130);
      textareaRef.current.style.height = `${nextH}px`;
    }
  };

  // 5. 新建空白会话
  const handleNewConversation = async () => {
    if (currentUser) {
      try {
        const res = await fetch("/api/ai/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "新对话" }),
        });
        if (res.ok) {
          const data = await res.json();
          const newConv = data.conversation;
          setConversations((prev) => [newConv, ...prev]);
          setActiveConversationId(newConv.id);
          setMessages([]);
        }
      } catch (err) {
        console.error("Failed to create new conversation:", err);
      }
    } else {
      setActiveConversationId(null);
      setMessages([]);
      localStorage.removeItem(GUEST_STORAGE_KEY);
    }
    setInputValue("");
    setIsMobileDrawerOpen(false);
    setIsHeaderMenuOpen(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "46px";
    }
  };

  // 6. 重命名会话
  const handleRenameConversation = async (convId?: string, oldTitle?: string) => {
    const targetId = convId || activeConversationId;
    if (!targetId) return;

    const currentTitle = oldTitle || conversations.find((c) => c.id === targetId)?.title || "新对话";
    const newTitle = window.prompt("请输入新会话标题：", currentTitle);
    if (!newTitle || newTitle.trim() === currentTitle.trim()) return;

    try {
      if (currentUser) {
        const res = await fetch(`/api/ai/conversations/${targetId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle.trim().slice(0, 25) }),
        });
        if (res.ok) {
          setConversations((prev) =>
            prev.map((c) => (c.id === targetId ? { ...c, title: newTitle.trim().slice(0, 25) } : c))
          );
        }
      } else {
        setConversations((prev) =>
          prev.map((c) => (c.id === targetId ? { ...c, title: newTitle.trim().slice(0, 25) } : c))
        );
      }
    } catch (err) {
      console.error("Failed to rename conversation:", err);
    } finally {
      setMenuOpenConvId(null);
      setIsHeaderMenuOpen(false);
    }
  };

  // 7. 删除会话
  const handleDeleteConversation = async (convId?: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const targetId = convId || activeConversationId;
    if (!targetId) return;

    if (!window.confirm("确定要删除此会话记录吗？此操作不可恢复。")) return;

    try {
      if (currentUser) {
        const res = await fetch(`/api/ai/conversations/${targetId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          const updated = conversations.filter((c) => c.id !== targetId);
          setConversations(updated);
          if (activeConversationId === targetId) {
            if (updated.length > 0) {
              loadConversationDetail(updated[0].id);
            } else {
              setActiveConversationId(null);
              setMessages([]);
            }
          }
        }
      } else {
        const updated = conversations.filter((c) => c.id !== targetId);
        setConversations(updated);
        setActiveConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    } finally {
      setMenuOpenConvId(null);
      setIsHeaderMenuOpen(false);
    }
  };

  // 8. 清空当前对话内容
  const handleClearCurrentChat = () => {
    if (messages.length === 0) return;
    if (window.confirm("确定清空当前会话的所有聊天内容吗？")) {
      setMessages([]);
      if (!currentUser) {
        localStorage.removeItem(GUEST_STORAGE_KEY);
      }
    }
    setIsHeaderMenuOpen(false);
  };

  // 9. 发送消息
  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (typeof queryText === "string" ? queryText : inputValue).trim();
    if (!textToSend || isSubmitting) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "success",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    if (textareaRef.current) textareaRef.current.style.height = "46px";

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsSubmitting(true);

    try {
      let endpoint = "/api/ai/assistant";
      let payload: any = { message: textToSend };

      if (currentUser && activeConversationId) {
        endpoint = `/api/ai/conversations/${activeConversationId}/messages`;
      } else if (currentUser && !activeConversationId) {
        endpoint = "/api/ai/assistant";
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`服务响应异常 (${res.status})`);

      const data = await res.json();

      if (data.conversationId && !activeConversationId) {
        setActiveConversationId(data.conversationId);
        fetchConversations();
      }

      // 兼容多格式、多轮对话接口返回的资源结构
      const rawResources =
        (Array.isArray(data.resources) && data.resources.length > 0 ? data.resources : null) ||
        (Array.isArray(data.assistantMessage?.resources) && data.assistantMessage.resources.length > 0 ? data.assistantMessage.resources : null) ||
        (Array.isArray(data.sources) && data.sources.length > 0 ? data.sources : null) ||
        (Array.isArray(data.assistantMessage?.sources) && data.assistantMessage.sources.length > 0 ? data.assistantMessage.sources : null) ||
        [];

      const mappedSources: SearchSource[] = rawResources.map((r: any) => ({
        id: r.id || `res-${Math.random()}`,
        type: (r.type || "listing").toLowerCase() as any,
        title: r.title || "推荐信息",
        url: r.url || "#",
        priceOrSalary: r.price || r.priceOrSalary,
        location: r.location,
        metaBadge: r.badgeText || r.metaBadge,
        companyOrPublisher: r.subTitle || r.companyOrPublisher,
      }));

      const moreUrl = data.moreUrl || data.assistantMessage?.moreUrl;
      const moreText = data.moreText || data.assistantMessage?.moreText;

      const mappedChannelLink =
        moreUrl && moreText
          ? {
              channelName: moreText.replace(/^[>前往查看全部]+|[ >]+$/g, "").trim() || "相关频道",
              url: moreUrl,
              buttonText: moreText,
            }
          : data.channelLink || data.assistantMessage?.channelLink;

      const totalMatches =
        typeof data.totalMatches === "number"
          ? data.totalMatches
          : typeof data.assistantMessage?.totalMatches === "number"
          ? data.assistantMessage.totalMatches
          : undefined;

      const suggestedFollowUps = Array.isArray(data.suggestedFollowUps)
        ? data.suggestedFollowUps
        : Array.isArray(data.assistantMessage?.suggestedFollowUps)
        ? data.assistantMessage.suggestedFollowUps
        : [];

      // 健壮提取多轮对话或单轮请求中的回答文本，杜绝空文本回退循环
      let replyContent =
        (typeof data.reply === "string" && data.reply.trim()) ||
        (typeof data.assistantMessage?.content === "string" && data.assistantMessage.content.trim()) ||
        (typeof data.content === "string" && data.content.trim()) ||
        "";

      if (!replyContent) {
        if (mappedSources.length > 0) {
          replyContent = `我帮您在杨林生活网检索到 ${totalMatches || mappedSources.length} 条相关本地信息，先为您挑选出匹配度最高的内容：`;
        } else {
          replyContent = "我已为您检索杨林生活网全域数据库。目前暂未找到与您描述完全匹配的内容，您可以尝试精简或更换关键词重新查询，或前往下方对应专区直接浏览。";
        }
      }

      const aiMsg: ChatMessage = {
        id: data.messageId || data.assistantMessage?.id || `ai-${Date.now()}`,
        role: "assistant",
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: mappedSources,
        totalMatches,
        channelLink: mappedChannelLink,
        suggestedFollowUps,
        status: "success",
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      if (err.name === "AbortError" || err.message?.includes("aborted")) {
        console.log("Chat request canceled by user.");
        return;
      }
      console.error("AI chat error:", err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "抱歉，检索或回答生成过程中遇到网络波动。请点击下方“重新尝试”再次查询。",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "error",
        failedQuery: textToSend,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSubmitting(false);
      abortControllerRef.current = null;
    }
  };

  // 10. 复制消息内容
  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // 11. 时间分组计算
  const groupedConversations = useMemo(() => {
    const today: ConversationItem[] = [];
    const yesterday: ConversationItem[] = [];
    const last7Days: ConversationItem[] = [];
    const earlier: ConversationItem[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart = todayStart - 86400000 * 7;

    conversations.forEach((conv) => {
      const time = new Date(conv.lastMessageAt || conv.createdAt).getTime();
      if (time >= todayStart) today.push(conv);
      else if (time >= yesterdayStart) yesterday.push(conv);
      else if (time >= weekStart) last7Days.push(conv);
      else earlier.push(conv);
    });

    return { today, yesterday, last7Days, earlier };
  }, [conversations]);

  // 12. 动态继续追问：不允许固定同一组问题，根据最新对话上下文智能衍生
  const currentFollowUps: string[] = useMemo(() => {
    if (messages.length === 0) return [];

    let latestAssistant: ChatMessage | undefined;
    let latestUser: ChatMessage | undefined;

    for (let i = messages.length - 1; i >= 0; i--) {
      if (!latestAssistant && messages[i].role === "assistant") {
        latestAssistant = messages[i];
      }
      if (!latestUser && messages[i].role === "user") {
        latestUser = messages[i];
      }
      if (latestAssistant && latestUser) break;
    }

    // 若后端明确返回了针对性追问，优先使用
    if (
      latestAssistant &&
      Array.isArray(latestAssistant.suggestedFollowUps) &&
      latestAssistant.suggestedFollowUps.length > 0
    ) {
      return latestAssistant.suggestedFollowUps;
    }

    // 否则基于最近提问与回复关键词动态衍生不同问题簇（动态轮转池，多轮对话绝不固定）
    const contextText = `${latestUser?.content || ""} ${latestAssistant?.content || ""}`.toLowerCase();
    const turn = Math.max(0, Math.floor(messages.length / 2));
    const pickQuestions = (pool: string[]) => {
      const offset = (turn * 2) % pool.length;
      return [...pool.slice(offset), ...pool.slice(0, offset)].slice(0, 4);
    };

    if (
      contextText.includes("招") ||
      contextText.includes("工") ||
      contextText.includes("薪") ||
      contextText.includes("普工") ||
      contextText.includes("岗")
    ) {
      return pickQuestions([
        "月薪5000以上包吃住急招岗位",
        "经开区两班倒补贴怎么样？",
        "附近有哪些名企大厂直聘？",
        "不需要经验的岗位有哪些？",
        "最新发布的日结/兼职工作",
        "经开区长白班岗位推荐",
        "有五险一金待遇好的企业",
        "离大学城近的轻工/文职工作",
      ]);
    }

    if (
      contextText.includes("房") ||
      contextText.includes("租") ||
      contextText.includes("单间") ||
      contextText.includes("公寓") ||
      contextText.includes("合租")
    ) {
      return pickQuestions([
        "大学城附近带独卫阳台单间",
        "租金600元以内的合租房源",
        "文理学院/师大步行5分钟内",
        "是否可以押一付一或短租？",
        "整租两室一厅带家电精装",
        "大学城周边独栋/自建房直租",
        "嵩明县城周边电梯高层租房",
        "房东个人直租免中介费房源",
      ]);
    }

    if (
      contextText.includes("厂") ||
      contextText.includes("车间") ||
      contextText.includes("地") ||
      contextText.includes("仓库") ||
      contextText.includes("行车")
    ) {
      return pickQuestions([
        "配电200KVA以上单层厂房",
        "带有5吨以上行车起吊库房",
        "17.5米大挂车能直接进出吗？",
        "经开区1000平左右可分租厂房",
        "食品/轻工标准生产车间",
        "园区独门独院办公厂房一体",
        "租金每平米月单价是多少？",
        "园区环保消防环评过审标准",
      ]);
    }

    if (
      contextText.includes("修") ||
      contextText.includes("漏") ||
      contextText.includes("水") ||
      contextText.includes("电") ||
      contextText.includes("师傅") ||
      contextText.includes("开锁")
    ) {
      return pickQuestions([
        "附近30分钟内能上门的师傅",
        "同城水电维修收费标准参考",
        "查看师傅过往维修评价",
        "下水管道疏通一次大约多少钱？",
        "电路漏电空气开关跳闸维修",
        "家电清洗/空调维修师傅电话",
        "门窗换锁芯同城开锁服务",
        "防水补漏师傅联系方式",
      ]);
    }

    if (
      contextText.includes("吃") ||
      contextText.includes("餐") ||
      contextText.includes("火锅") ||
      contextText.includes("夜市") ||
      contextText.includes("店")
    ) {
      return pickQuestions([
        "职教园区口碑最好的夜市小吃",
        "杨林本地正宗酸菜牛肉推荐",
        "适合朋友聚餐的特色餐馆",
        "附近高评分商家营业时间",
        "大学城商业街人气奶茶甜品",
        "嵩明特产美食/羊汤锅推荐",
        "经开区附近适合商务宴请的店",
        "有没有送外卖到宿舍/厂区的？",
      ]);
    }

    if (
      contextText.includes("车") ||
      contextText.includes("拼车") ||
      contextText.includes("顺风") ||
      contextText.includes("机场") ||
      contextText.includes("昆明")
    ) {
      return pickQuestions([
        "杨林到昆明拼车几点发车？",
        "长水机场往返车队电话",
        "北部客运站顺风拼车",
        "夜间拼车预约注意事项",
        "大学城周五返程昆明顺风车",
        "拼车单程票价一般多少钱？",
        "有提供大件行李后备箱吗？",
        "昆明市区直达杨林经开区拼车",
      ]);
    }

    return pickQuestions([
      "查看杨林本地最新发布信息",
      "帮我按价格从低到高看看",
      "杨林镇上还有哪些选择？",
      "附近急招和急租的信息汇总",
      "帮我筛选今天刚发布的",
      "经开区有哪些热门便民服务？",
    ]);
  }, [messages]);

  const sendMsgRef = useRef(handleSendMessage);
  sendMsgRef.current = handleSendMessage;
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__sendTestMessage = (text: string) => sendMsgRef.current(text);
    }
  });

  const hasHistory = conversations.length > 0;

  return (
    <div className="yl-ai-root">
      {/* 专属样式表：弱化边框、强化层级、优化卡片视觉 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            html, body {
              overflow: hidden !important;
              height: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .yl-ai-root {
              position: fixed;
              top: 0; left: 0; right: 0; bottom: 0;
              width: 100%;
              height: 100dvh;
              min-height: 100dvh;
              max-height: 100dvh;
              display: flex;
              flex-direction: column;
              background-color: #F8FAFC;
              color: #0F172A;
              z-index: 30;
              overflow: hidden;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
            }
            .yl-ai-desktop-header {
              flex-shrink: 0;
              z-index: 20;
            }
            .yl-ai-body {
              flex: 1;
              min-height: 0;
              max-width: 1360px;
              width: 100%;
              margin: 0 auto;
              padding: 10px 14px;
              display: flex;
              gap: 12px;
              overflow: hidden;
              box-sizing: border-box;
            }
            .yl-ai-sidebar {
              width: 240px;
              min-width: 240px;
              max-width: 240px;
              background: #FFFFFF;
              border: 1px solid #F1F5F9;
              border-radius: 14px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.02);
              display: flex;
              flex-direction: column;
              overflow: hidden;
              flex-shrink: 0;
            }
            .yl-ai-main {
              flex: 1;
              min-width: 0;
              min-height: 0;
              background: #FFFFFF;
              border: 1px solid #F1F5F9;
              border-radius: 14px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.02);
              display: flex;
              flex-direction: column;
              overflow: hidden;
              position: relative;
            }
            .yl-ai-chat-area {
              flex: 1;
              min-height: 0;
              overflow-y: auto;
              -webkit-overflow-scrolling: touch;
              padding: 18px 24px 10px;
              box-sizing: border-box;
            }
            .yl-ai-chat-container {
              max-width: 860px;
              margin: 0 auto;
              width: 100%;
              display: flex;
              flex-direction: column;
              gap: 18px;
            }
            .yl-ai-composer-wrap {
              flex-shrink: 0;
              position: sticky;
              bottom: 0;
              background: #FFFFFF;
              border-top: 1px solid #F1F5F9;
              padding: 8px 14px calc(8px + env(safe-area-inset-bottom, 0px));
              z-index: 30;
            }
            .yl-ai-composer-box {
              max-width: 860px;
              margin: 0 auto;
              width: 100%;
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            .yl-ai-btn-primary {
              background: #0B7A75;
              color: #FFFFFF;
              border: none;
              border-radius: 8px;
              padding: 8px 14px;
              font-weight: 700;
              cursor: pointer;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              transition: all 0.15s;
              text-decoration: none;
              box-shadow: 0 1px 2px rgba(11, 122, 117, 0.2);
            }
            .yl-ai-btn-primary:hover {
              background: #075E5A;
            }
            .yl-ai-bubble-user {
              background: #EAF8F3;
              color: #065F46;
              border: 1px solid #D1F2E6;
              border-radius: 14px 14px 2px 14px;
              padding: 10px 15px;
              font-size: 14px;
              line-height: 1.6;
              box-shadow: 0 1px 2px rgba(0,0,0,0.02);
            }
            .yl-ai-bubble-ai {
              color: #0F172A;
              font-size: 14.5px;
              line-height: 1.7;
            }
            .yl-ai-resource-card {
              background: #FFFFFF;
              border: 1px solid #F1F5F9;
              border-radius: 10px;
              padding: 10px 12px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              text-decoration: none;
              color: inherit;
              transition: all 0.15s ease;
              box-shadow: 0 1px 2px rgba(0,0,0,0.02);
            }
            .yl-ai-resource-card:hover {
              border-color: #0B7A75;
              box-shadow: 0 4px 12px rgba(11, 122, 117, 0.08);
              transform: translateY(-1px);
            }
            @media (max-width: 768px) {
              .yl-ai-desktop-header { display: none !important; }
              .yl-ai-sidebar { display: none !important; }
              .yl-ai-mobile-header { display: flex !important; }
              .yl-ai-pc-header { display: none !important; }
              .yl-ai-body { padding: 0 !important; gap: 0 !important; }
              .yl-ai-main { border-radius: 0 !important; border: none !important; }
              .yl-ai-composer-wrap {
                padding: 8px 12px calc(8px + env(safe-area-inset-bottom, 0px)) !important;
                position: sticky !important;
                bottom: 0 !important;
                z-index: 30 !important;
                background: #FFFFFF !important;
              }
            }
            @media (min-width: 769px) {
              .yl-ai-mobile-header { display: none !important; }
              .yl-ai-pc-header { display: flex !important; }
            }
          `,
        }}
      />

      {/* 顶部全站主导航 (PC 端专属展现，手机端自动隐藏以呈现原生沉浸体验) */}
      <div className="yl-ai-desktop-header">
        <Navbar />
      </div>

      {/* 工作区主体：左侧 Sidebar (240px) + 右侧主聊天区 */}
      <div className="yl-ai-body">
        {/* ======================= PC 左侧历史会话栏 (240px) ======================= */}
        <aside className="yl-ai-sidebar">
          {/* 顶部：新建对话按钮 */}
          <div style={{ padding: "10px 12px", borderBottom: "1px solid #F8FAFC", flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleNewConversation}
              className="yl-ai-btn-primary"
              style={{ width: "100%", fontSize: "12.5px", padding: "7px 12px" }}
            >
              <Plus style={{ width: "15px", height: "15px" }} />
              <span>新建对话</span>
            </button>
          </div>

          {/* 会话列表：优先展示真实历史会话 (今天/昨天/最近7天)；仅在无历史时展示常用提问引导 */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              padding: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontSize: "12px",
            }}
          >
            {hasHistory ? (
              <>
                {groupedConversations.today.length > 0 && (
                  <div>
                    <div style={{ padding: "3px 8px", fontSize: "10.5px", fontWeight: 700, color: "#94A3B8" }}>
                      今天
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      {groupedConversations.today.map((c) => (
                        <ConversationRow
                          key={c.id}
                          conv={c}
                          isActive={activeConversationId === c.id}
                          onSelect={() => loadConversationDetail(c.id)}
                          onRename={() => handleRenameConversation(c.id, c.title)}
                          onDelete={(e) => handleDeleteConversation(c.id, e)}
                          isMenuOpen={menuOpenConvId === c.id}
                          setMenuOpen={(open) => setMenuOpenConvId(open ? c.id : null)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {groupedConversations.yesterday.length > 0 && (
                  <div>
                    <div style={{ padding: "3px 8px", fontSize: "10.5px", fontWeight: 700, color: "#94A3B8" }}>
                      昨天
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      {groupedConversations.yesterday.map((c) => (
                        <ConversationRow
                          key={c.id}
                          conv={c}
                          isActive={activeConversationId === c.id}
                          onSelect={() => loadConversationDetail(c.id)}
                          onRename={() => handleRenameConversation(c.id, c.title)}
                          onDelete={(e) => handleDeleteConversation(c.id, e)}
                          isMenuOpen={menuOpenConvId === c.id}
                          setMenuOpen={(open) => setMenuOpenConvId(open ? c.id : null)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {groupedConversations.last7Days.length > 0 && (
                  <div>
                    <div style={{ padding: "3px 8px", fontSize: "10.5px", fontWeight: 700, color: "#94A3B8" }}>
                      最近 7 天
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      {groupedConversations.last7Days.map((c) => (
                        <ConversationRow
                          key={c.id}
                          conv={c}
                          isActive={activeConversationId === c.id}
                          onSelect={() => loadConversationDetail(c.id)}
                          onRename={() => handleRenameConversation(c.id, c.title)}
                          onDelete={(e) => handleDeleteConversation(c.id, e)}
                          isMenuOpen={menuOpenConvId === c.id}
                          setMenuOpen={(open) => setMenuOpenConvId(open ? c.id : null)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {groupedConversations.earlier.length > 0 && (
                  <div>
                    <div style={{ padding: "3px 8px", fontSize: "10.5px", fontWeight: 700, color: "#94A3B8" }}>
                      更早
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      {groupedConversations.earlier.map((c) => (
                        <ConversationRow
                          key={c.id}
                          conv={c}
                          isActive={activeConversationId === c.id}
                          onSelect={() => loadConversationDetail(c.id)}
                          onRename={() => handleRenameConversation(c.id, c.title)}
                          onDelete={(e) => handleDeleteConversation(c.id, e)}
                          isMenuOpen={menuOpenConvId === c.id}
                          setMenuOpen={(open) => setMenuOpenConvId(open ? c.id : null)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* 无历史时显示：常用提问引导 */
              <div style={{ padding: "4px 0", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ padding: "4px 8px", fontSize: "11px", fontWeight: 700, color: "#64748B" }}>
                  常用提问引导
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  {INITIAL_PROMPTS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(p)}
                      style={{
                        textAlign: "left",
                        padding: "7px 9px",
                        borderRadius: "6px",
                        color: "#475569",
                        background: "transparent",
                        border: "none",
                        fontSize: "11.5px",
                        cursor: "pointer",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 底部轻量状态条 */}
          <div
            style={{
              padding: "8px 12px",
              borderTop: "1px solid #F8FAFC",
              background: "#FAFAFA",
              fontSize: "11px",
              color: "#64748B",
              flexShrink: 0,
            }}
          >
            {currentUser ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: "#0B7A75",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: "bold",
                      flexShrink: 0,
                    }}
                  >
                    {currentUser.username?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span
                    style={{
                      fontWeight: 600,
                      color: "#334155",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {currentUser.username}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "10px",
                    color: "#059669",
                    background: "#ECFDF5",
                    padding: "1px 5px",
                    borderRadius: "3px",
                    flexShrink: 0,
                  }}
                >
                  云端存储
                </span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
                <span style={{ color: "#94A3B8" }}>本地会话</span>
                <Link
                  href="/login?redirect=/assistant"
                  style={{ color: "#0B7A75", fontWeight: 700, textDecoration: "none", flexShrink: 0 }}
                >
                  登录同步
                </Link>
              </div>
            )}
          </div>
        </aside>

        {/* ======================= 右侧主聊天工作区 ======================= */}
        <section className="yl-ai-main">
          {/* PC 端专属 Header (压缩高度：标题一行，副标题一行，小绿点状态) */}
          <header
            className="yl-ai-pc-header"
            style={{
              height: "48px",
              padding: "0 18px",
              borderBottom: "1px solid #F1F5F9",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#FFFFFF",
              zIndex: 10,
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: "#0B7A75",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Bot style={{ width: "16px", height: "16px" }} />
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", lineHeight: 1.2 }}>
                  <h1 style={{ fontSize: "14px", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                    杨林生活 AI 助手
                  </h1>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#059669", fontWeight: 500 }}>
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#10B981",
                        display: "inline-block",
                      }}
                    />
                    已连接真实数据源
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px", lineHeight: 1.2 }}>
                  查招聘 · 找房源 · 查厂房 · 找师傅 · 问本地便民
                </div>
              </div>
            </div>

            {/* 右侧操作按钮组 */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", position: "relative" }}>
              <button
                type="button"
                onClick={handleNewConversation}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  fontSize: "11.5px",
                  color: "#475569",
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  padding: "5px 10px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 600,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#E6F4F3";
                  e.currentTarget.style.color = "#0B7A75";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#F8FAFC";
                  e.currentTarget.style.color = "#475569";
                }}
              >
                <Plus style={{ width: "13px", height: "13px" }} />
                <span>新对话</span>
              </button>

              {/* 更多菜单按钮 */}
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                  style={{
                    padding: "5px",
                    borderRadius: "6px",
                    color: "#64748B",
                    background: "transparent",
                    border: "1px solid #E2E8F0",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="更多选项"
                >
                  <MoreVertical style={{ width: "15px", height: "15px" }} />
                </button>

                {isHeaderMenuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "100%",
                      marginTop: "4px",
                      width: "124px",
                      background: "#FFFFFF",
                      borderRadius: "8px",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                      border: "1px solid #E2E8F0",
                      padding: "4px",
                      zIndex: 40,
                      fontSize: "11.5px",
                    }}
                  >
                    {currentUser && activeConversationId && (
                      <button
                        type="button"
                        onClick={() => handleRenameConversation()}
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          textAlign: "left",
                          color: "#334155",
                          background: "transparent",
                          border: "none",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <Edit2 style={{ width: "13px", height: "13px", color: "#94A3B8" }} />
                        <span>重命名</span>
                      </button>
                    )}
                    {messages.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearCurrentChat}
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          textAlign: "left",
                          color: "#334155",
                          background: "transparent",
                          border: "none",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <RotateCcw style={{ width: "13px", height: "13px", color: "#94A3B8" }} />
                        <span>清空当前对话</span>
                      </button>
                    )}
                    {currentUser && activeConversationId && (
                      <button
                        type="button"
                        onClick={() => handleDeleteConversation()}
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          textAlign: "left",
                          color: "#EF4444",
                          background: "transparent",
                          border: "none",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#FEE2E2")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <Trash2 style={{ width: "13px", height: "13px" }} />
                        <span>删除会话</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* 移动端专属 Header (高度紧凑，带返回、首页直达、品牌与频道快捷入口) */}
          <header
            className="yl-ai-mobile-header"
            style={{
              padding: "8px 12px 6px",
              borderBottom: "1px solid #F1F5F9",
              flexDirection: "column",
              background: "#FFFFFF",
              flexShrink: 0,
              position: "relative",
              zIndex: 10,
              boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
              {/* 左侧：返回上一页 + 首页直达 */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  type="button"
                  onClick={handleMobileBack}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                    padding: "5px 8px 5px 6px",
                    borderRadius: "8px",
                    color: "#0F172A",
                    background: "#F1F5F9",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    WebkitTapHighlightColor: "transparent",
                  }}
                  aria-label="返回上一页"
                >
                  <ArrowLeft style={{ width: "15px", height: "15px" }} />
                  <span>返回</span>
                </button>

                <Link
                  href="/"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                    padding: "5px 8px",
                    borderRadius: "8px",
                    color: "#0B7A75",
                    background: "#E6F4F3",
                    textDecoration: "none",
                    fontSize: "12px",
                    fontWeight: 700,
                    WebkitTapHighlightColor: "transparent",
                  }}
                  aria-label="返回网站首页"
                >
                  <Home style={{ width: "13px", height: "13px" }} />
                  <span>首页</span>
                </Link>
              </div>

              {/* 中间：标题与图标 */}
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "6px",
                    background: "#0B7A75",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Bot style={{ width: "12px", height: "12px" }} />
                </div>
                <h1 style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                  AI 助手
                </h1>
              </div>

              {/* 右侧：新建对话 + 历史抽屉 */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  type="button"
                  onClick={handleNewConversation}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    background: "#E6F4F3",
                    color: "#0B7A75",
                    fontSize: "11px",
                    fontWeight: 700,
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                    cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <Plus style={{ width: "11px", height: "11px" }} />
                  <span>新建</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(true)}
                  style={{
                    padding: "5px",
                    borderRadius: "6px",
                    color: "#475569",
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    WebkitTapHighlightColor: "transparent",
                  }}
                  aria-label="历史会话"
                >
                  <Menu style={{ width: "15px", height: "15px" }} />
                </button>
              </div>
            </div>

            {/* 第二行：高频频道捷径入口 (横向轻便滚动) */}
            <div
              style={{
                marginTop: "5px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                overflowX: "auto",
                whiteSpace: "nowrap",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                fontSize: "11px",
                paddingBottom: "1px",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "#059669", fontWeight: 700, flexShrink: 0 }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#10B981" }}></span>
                向导
              </span>
              <span style={{ color: "#CBD5E1", flexShrink: 0 }}>|</span>
              <Link href="/jobs" style={{ color: "#475569", textDecoration: "none", padding: "1px 6px", borderRadius: "4px", background: "#F1F5F9", flexShrink: 0 }}>💼 招聘</Link>
              <Link href="/house" style={{ color: "#475569", textDecoration: "none", padding: "1px 6px", borderRadius: "4px", background: "#F1F5F9", flexShrink: 0 }}>🏠 租房</Link>
              <Link href="/industrial" style={{ color: "#475569", textDecoration: "none", padding: "1px 6px", borderRadius: "4px", background: "#F1F5F9", flexShrink: 0 }}>🏭 厂房</Link>
              <Link href="/services" style={{ color: "#475569", textDecoration: "none", padding: "1px 6px", borderRadius: "4px", background: "#F1F5F9", flexShrink: 0 }}>🔧 师傅</Link>
              <Link href="/mall" style={{ color: "#475569", textDecoration: "none", padding: "1px 6px", borderRadius: "4px", background: "#F1F5F9", flexShrink: 0 }}>🛍️ 商城</Link>
            </div>
          </header>

          {/* 消息滚动主区域：最大可读宽度严格控制在 860px 居中 */}
          <div ref={chatContainerRef} className="yl-ai-chat-area">
            <div className="yl-ai-chat-container">
              {isLoadingMessages ? (
                <div style={{ padding: "30px 0", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ height: "36px", background: "#F1F5F9", borderRadius: "10px", width: "50%", alignSelf: "flex-end", opacity: 0.7 }} />
                  <div style={{ height: "80px", background: "#F8FAFC", borderRadius: "12px", width: "100%", opacity: 0.7 }} />
                  <div style={{ height: "40px", background: "#F8FAFC", borderRadius: "10px", width: "70%", opacity: 0.7 }} />
                </div>
              ) : messages.length === 0 ? (
                /* 空状态：综合门户向导与场景卡片 */
                <div style={{ padding: "10px 0 20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div
                    style={{
                      background: "linear-gradient(135deg, #F0FBF7 0%, #FFFFFF 100%)",
                      border: "1px solid #E6F4F3",
                      borderRadius: "14px",
                      padding: "16px 18px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          background: "#0B7A75",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                      >
                        <Sparkles style={{ width: "16px", height: "16px" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <h2 style={{ fontSize: "14.5px", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                          杨林生活网智能向导 🤖
                        </h2>
                        <p style={{ margin: 0, fontSize: "12px", color: "#475569", lineHeight: 1.55 }}>
                          已直连杨林经开区、大学城及周边真实全站数据。告诉我您的具体需求，为您即时匹配岗位、房源、厂房与师傅！
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 热门咨询场景矩阵 */}
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748B", marginBottom: "8px" }}>
                      热门咨询场景（点击直接提问）
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "8px" }}>
                      {SCENARIO_CARDS.map((card, idx) => {
                        const IconComponent = card.icon;
                        return (
                          <div
                            key={idx}
                            onClick={() => handleSendMessage(card.prompt)}
                            style={{
                              background: "#FFFFFF",
                              border: "1px solid #F1F5F9",
                              borderRadius: "10px",
                              padding: "12px 14px",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "#0B7A75";
                              e.currentTarget.style.transform = "translateY(-1px)";
                              e.currentTarget.style.boxShadow = "0 3px 10px rgba(11, 122, 117, 0.08)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "#F1F5F9";
                              e.currentTarget.style.transform = "none";
                              e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)";
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                <div
                                  style={{
                                    width: "26px",
                                    height: "26px",
                                    borderRadius: "6px",
                                    background: card.iconBg,
                                    color: card.iconColor,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <IconComponent style={{ width: "14px", height: "14px" }} />
                                </div>
                                <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>{card.title}</span>
                              </div>
                              <ArrowRight style={{ width: "13px", height: "13px", color: "#94A3B8" }} />
                            </div>
                            <p style={{ margin: "0 0 6px 0", fontSize: "11.5px", color: "#64748B", lineHeight: 1.45 }}>
                              {card.desc}
                            </p>
                            <div
                              style={{
                                fontSize: "10.5px",
                                color: "#94A3B8",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              “{card.prompt}”
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* 会话消息列表 */
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexDirection: msg.role === "user" ? "row-reverse" : "row",
                      alignItems: "flex-start",
                    }}
                  >
                    {/* 头像：AI 统一小尺寸 (26px)，用户弱化为圆形浅灰或免头像 */}
                    {msg.role === "assistant" ? (
                      <div
                        style={{
                          width: "26px",
                          height: "26px",
                          borderRadius: "8px",
                          background: "#0B7A75",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                      >
                        <Bot style={{ width: "15px", height: "15px" }} />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          background: "#E2E8F0",
                          color: "#64748B",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: "2px",
                          fontSize: "10.5px",
                          fontWeight: 700,
                        }}
                      >
                        {currentUser?.username?.[0]?.toUpperCase() || "我"}
                      </div>
                    )}

                    {/* 消息主体 */}
                    <div
                      style={{
                        maxWidth: "88%",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                      }}
                    >
                      {/* 用户消息气泡 */}
                      {msg.role === "user" ? (
                        <div className="yl-ai-bubble-user">{msg.content}</div>
                      ) : (
                        /* AI 回答：减弱大边框，去除过度套卡感 */
                        <div
                          style={{
                            width: "100%",
                            background: "#F8FAFC",
                            borderRadius: "2px 14px 14px 14px",
                            padding: "12px 16px",
                          }}
                        >
                          {/* 文本内容 */}
                          <div className="yl-ai-bubble-ai" style={{ whiteSpace: "pre-wrap" }}>
                            {msg.content}
                          </div>

                          {/* 真实数据资源卡片 (仅当有真实推荐卡片且数量>0时展示，严禁闲聊或0匹配空渲染) */}
                          {msg.sources && msg.sources.length > 0 && (
                            <div style={{ marginTop: "12px", paddingTop: "10px" }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  marginBottom: "8px",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "11.5px",
                                    fontWeight: 700,
                                    color: "#475569",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <CheckCircle2
                                    aria-hidden="true"
                                    focusable="false"
                                    style={{ width: "13px", height: "13px", color: "#0B7A75", flexShrink: 0 }}
                                  />
                                  <span>杨林生活网真实资源推荐</span>
                                </span>
                                {typeof msg.totalMatches === "number" && msg.totalMatches > 0 && (
                                  <span style={{ fontSize: "10.5px", color: "#94A3B8" }}>
                                    共匹配到 <strong>{msg.totalMatches}</strong> 条
                                  </span>
                                )}
                              </div>

                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                                  gap: "8px",
                                }}
                              >
                                {msg.sources.map((item, idx) => (
                                  <ResourceItemCard key={idx} item={item} />
                                ))}
                              </div>

                              {/* 频道跳转锚点按钮 (有卡片时在卡片右下方展示) */}
                              {msg.channelLink && (
                                <div style={{ marginTop: "10px", textAlign: "right" }}>
                                  <Link
                                    href={msg.channelLink.url}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      fontSize: "11.5px",
                                      fontWeight: 700,
                                      color: "#0B7A75",
                                      background: "#E6F4F3",
                                      padding: "4px 10px",
                                      borderRadius: "6px",
                                      textDecoration: "none",
                                      transition: "background 0.15s",
                                    }}
                                  >
                                    <span>{msg.channelLink.buttonText || `查看全部 ${msg.channelLink.channelName} 信息`}</span>
                                    <ArrowRight aria-hidden="true" focusable="false" style={{ width: "12px", height: "12px" }} />
                                  </Link>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 独立频道跳转卡片 (例如导航意图或0结果时的快捷引导直达通道) */}
                          {msg.channelLink && (!msg.sources || msg.sources.length === 0) && (
                            <div style={{ marginTop: "12px", paddingTop: "4px" }}>
                              <Link
                                href={msg.channelLink.url}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  color: "#0B7A75",
                                  background: "#E6F4F3",
                                  border: "1px solid #C4E7E4",
                                  padding: "7px 14px",
                                  borderRadius: "8px",
                                  textDecoration: "none",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                <span>{msg.channelLink.buttonText || `前往 ${msg.channelLink.channelName}`}</span>
                                <ArrowRight aria-hidden="true" focusable="false" style={{ width: "13px", height: "13px", flexShrink: 0 }} />
                              </Link>
                            </div>
                          )}

                          {/* 底部操作小栏：轻量化，无多重重边框 */}
                          <div
                            style={{
                              marginTop: "10px",
                              paddingTop: "6px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              fontSize: "10.5px",
                              color: "#94A3B8",
                            }}
                          >
                            <span>{msg.timestamp}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <button
                                type="button"
                                onClick={() => handleCopyMessage(msg.id, msg.content)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#94A3B8",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  padding: 0,
                                }}
                                title="复制文本"
                              >
                                {copiedMessageId === msg.id ? (
                                  <>
                                    <Check style={{ width: "12px", height: "12px", color: "#059669" }} />
                                    <span style={{ color: "#059669" }}>已复制</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy style={{ width: "12px", height: "12px" }} />
                                    <span>复制</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => setFeedbackGiven((prev) => ({ ...prev, [msg.id]: "up" }))}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: feedbackGiven[msg.id] === "up" ? "#0B7A75" : "#94A3B8",
                                  cursor: "pointer",
                                  padding: 0,
                                }}
                                title="有帮助"
                              >
                                <ThumbsUp style={{ width: "12px", height: "12px" }} />
                              </button>

                              <button
                                type="button"
                                onClick={() => setFeedbackGiven((prev) => ({ ...prev, [msg.id]: "down" }))}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: feedbackGiven[msg.id] === "down" ? "#EF4444" : "#94A3B8",
                                  cursor: "pointer",
                                  padding: 0,
                                }}
                                title="不准确"
                              >
                                <ThumbsDown style={{ width: "12px", height: "12px" }} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* 思考等待反馈动画 */}
              {isSubmitting && (
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "8px",
                      background: "#0B7A75",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  >
                    <Bot style={{ width: "15px", height: "15px" }} />
                  </div>
                  <div
                    style={{
                      background: "#F8FAFC",
                      borderRadius: "2px 12px 12px 12px",
                      padding: "9px 13px",
                      fontSize: "12px",
                      color: "#475569",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "7px", fontWeight: 600 }}>
                      <span
                        style={{
                          display: "inline-block",
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "#0B7A75",
                          animation: "pulse 1.2s infinite",
                        }}
                      />
                      <span>
                        {submittingPhase === "understanding" && "正在理解需求…"}
                        {submittingPhase === "retrieving" && "正在检索杨林生活网全域真实数据…"}
                        {submittingPhase === "organizing" && "正在整理结果…"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* AI结果区域与底部Composer之间的 16~24px 呼吸缓冲 */}
              <div style={{ height: "20px", flexShrink: 0 }} />
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* ======================= 固定输入 Composer ======================= */}
          <div className="yl-ai-composer-wrap">
            <div className="yl-ai-composer-box">
              {/* 动态继续追问胶囊条（随对话主题动态衍生，绝不固定同一组） */}
              {Boolean(messages.length > 0 && currentFollowUps && currentFollowUps.length > 0) && (
                <div
                  style={{
                    overflowX: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "2px 0",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#94A3B8",
                      fontWeight: 600,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    <Sparkles style={{ width: "11px", height: "11px", color: "#0B7A75" }} />
                    继续追问：
                  </span>
                  {currentFollowUps.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      disabled={isSubmitting}
                      style={{
                        fontSize: "11px",
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        padding: "3px 10px",
                        borderRadius: "9999px",
                        color: "#475569",
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                        transition: "all 0.15s",
                        opacity: isSubmitting ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!isSubmitting) {
                          e.currentTarget.style.background = "#E6F4F3";
                          e.currentTarget.style.color = "#0B7A75";
                          e.currentTarget.style.borderColor = "#0B7A75";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSubmitting) {
                          e.currentTarget.style.background = "#F8FAFC";
                          e.currentTarget.style.color = "#475569";
                          e.currentTarget.style.borderColor = "#E2E8F0";
                        }
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* 输入框主表单：明确的发送按钮，去除多重边框与臃肿感 */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                style={{
                  background: "#F8FAFC",
                  borderRadius: "10px",
                  border: "1px solid #E2E8F0",
                  padding: "5px 8px 5px 10px",
                  minHeight: "44px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.15s ease",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#0B7A75";
                  e.currentTarget.style.background = "#FFFFFF";
                  e.currentTarget.style.boxShadow = "0 0 0 2px rgba(11, 122, 117, 0.08)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.background = "#F8FAFC";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center" }}>
                  <textarea
                    ref={textareaRef}
                    id="assistant-composer-textarea"
                    rows={1}
                    value={inputValue}
                    onChange={handleTextareaChange}
                    onKeyDown={(e) => {
                      if (e.nativeEvent.isComposing || (e as any).keyCode === 229) return;
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    onFocus={() => {
                      setTimeout(() => {
                        if (chatContainerRef.current) {
                          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                        }
                      }, 250);
                    }}
                    placeholder="告诉我你的需求，例如：“找经开区招聘”、“大学城租房”、“上门修水电”..."
                    style={{
                      width: "100%",
                      background: "transparent",
                      fontSize: "13.5px",
                      color: "#0F172A",
                      border: "none",
                      resize: "none",
                      outline: "none",
                      lineHeight: "20px",
                      minHeight: "24px",
                      maxHeight: "130px",
                      padding: "6px 0",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                    disabled={isSubmitting}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, paddingBottom: "1px" }}>
                  {isSubmitting ? (
                    <button
                      type="button"
                      onClick={handleAbort}
                      style={{
                        background: "#EF4444",
                        color: "#FFFFFF",
                        border: "none",
                        padding: "7px 12px",
                        borderRadius: "7px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        fontWeight: 700,
                        fontSize: "12px",
                        transition: "background 0.15s",
                      }}
                      title="停止生成"
                    >
                      <Square style={{ width: "11px", height: "11px", fill: "currentColor" }} />
                      <span>停止</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!inputValue.trim()}
                      style={{
                        background: inputValue.trim() ? "#0B7A75" : "#CBD5E1",
                        color: "#FFFFFF",
                        border: "none",
                        padding: "7px 14px",
                        borderRadius: "7px",
                        fontWeight: 700,
                        fontSize: "12.5px",
                        cursor: inputValue.trim() ? "pointer" : "not-allowed",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        transition: "all 0.15s ease",
                        boxShadow: inputValue.trim() ? "0 2px 6px rgba(11, 122, 117, 0.25)" : "none",
                      }}
                    >
                      <Send style={{ width: "13px", height: "13px" }} />
                      <span>发送</span>
                    </button>
                  )}
                </div>
              </form>

              {/* 底部弱化提示与回首页通道 */}
              <div
                style={{
                  textAlign: "center",
                  fontSize: "11px",
                  color: "#94A3B8",
                  marginTop: "3px",
                  userSelect: "none",
                  lineHeight: 1.3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  flexWrap: "wrap",
                }}
              >
                <span>基于本地公开信息生成，仅供参考</span>
                <span style={{ color: "#CBD5E1" }}>·</span>
                <Link
                  href="/"
                  style={{
                    color: "#0B7A75",
                    fontWeight: 700,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  <span>返回网站首页</span>
                  <ArrowRight style={{ width: "11px", height: "11px" }} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 移动端侧滑抽屉 (Drawer) */}
      {isMobileDrawerOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          <div
            style={{
              position: "relative",
              width: "80%",
              maxWidth: "300px",
              background: "#FFFFFF",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              zIndex: 10,
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                padding: "12px 14px",
                borderBottom: "1px solid #F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontWeight: 800, color: "#0F172A", fontSize: "13.5px" }}>历史对话</span>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                style={{ padding: "4px", borderRadius: "6px", color: "#94A3B8", background: "none", border: "none", cursor: "pointer" }}
              >
                <X style={{ width: "17px", height: "17px" }} />
              </button>
            </div>

            <div style={{ padding: "10px 12px", borderBottom: "1px solid #F1F5F9" }}>
              <button
                type="button"
                onClick={handleNewConversation}
                className="yl-ai-btn-primary"
                style={{ width: "100%", fontSize: "12px", padding: "7px 10px" }}
              >
                <Plus style={{ width: "14px", height: "14px" }} />
                <span>新建对话</span>
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "5px",
                fontSize: "12px",
              }}
            >
              {hasHistory ? (
                conversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => loadConversationDetail(c.id)}
                    style={{
                      padding: "9px 11px",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      background: activeConversationId === c.id ? "#E6F4F3" : "transparent",
                      color: activeConversationId === c.id ? "#0B7A75" : "#334155",
                      fontWeight: activeConversationId === c.id ? 700 : 500,
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteConversation(c.id, e)}
                      style={{ padding: "2px", color: "#94A3B8", background: "none", border: "none", cursor: "pointer" }}
                    >
                      <Trash2 style={{ width: "13px", height: "13px" }} />
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ padding: "16px 10px", textAlign: "center", color: "#94A3B8" }}>
                  <p style={{ margin: 0, fontSize: "12px" }}>暂无历史对话</p>
                </div>
              )}
            </div>

            {/* 登录状态/同步提示 */}
            {!currentUser && (
              <div
                style={{
                  padding: "8px 12px",
                  background: "#F0FDF4",
                  borderTop: "1px solid #DCFCE7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "11.5px",
                  flexShrink: 0,
                }}
              >
                <span style={{ color: "#065F46" }}>本地会话未同步</span>
                <Link
                  href="/login?redirect=/assistant"
                  style={{ color: "#0B7A75", fontWeight: 700, textDecoration: "none" }}
                >
                  登录同步 &gt;
                </Link>
              </div>
            )}

            {/* 移动端全站快捷跳转导航 */}
            <div
              style={{
                padding: "10px 12px",
                borderTop: "1px solid #F1F5F9",
                background: "#F8FAFC",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                fontSize: "11.5px",
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: "10px", color: "#94A3B8", fontWeight: 700 }}>杨林生活网频道</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px", fontSize: "11px" }}>
                <Link href="/" style={{ padding: "5px", borderRadius: "5px", color: "#334155", textDecoration: "none", background: "#FFFFFF", border: "1px solid #F1F5F9", textAlign: "center" }}>
                  🏠 网站首页
                </Link>
                <Link href="/jobs" style={{ padding: "5px", borderRadius: "5px", color: "#334155", textDecoration: "none", background: "#FFFFFF", border: "1px solid #F1F5F9", textAlign: "center" }}>
                  💼 求职招聘
                </Link>
                <Link href="/house" style={{ padding: "5px", borderRadius: "5px", color: "#334155", textDecoration: "none", background: "#FFFFFF", border: "1px solid #F1F5F9", textAlign: "center" }}>
                  🏢 租房买房
                </Link>
                <Link href="/services" style={{ padding: "5px", borderRadius: "5px", color: "#334155", textDecoration: "none", background: "#FFFFFF", border: "1px solid #F1F5F9", textAlign: "center" }}>
                  🔧 上门维修
                </Link>
                <Link href="/industrial" style={{ padding: "5px", borderRadius: "5px", color: "#334155", textDecoration: "none", background: "#FFFFFF", border: "1px solid #F1F5F9", textAlign: "center" }}>
                  🏭 园区厂房
                </Link>
                <Link href="/profile" style={{ padding: "5px", borderRadius: "5px", color: "#334155", textDecoration: "none", background: "#FFFFFF", border: "1px solid #F1F5F9", textAlign: "center" }}>
                  👤 个人中心
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 侧边栏单个会话项组件
function ConversationRow({
  conv,
  isActive,
  onSelect,
  onRename,
  onDelete,
  isMenuOpen,
  setMenuOpen,
}: {
  conv: ConversationItem;
  isActive: boolean;
  onSelect: () => void;
  onRename: () => void;
  onDelete: (e: React.MouseEvent) => void;
  isMenuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}) {
  return (
    <div
      onClick={onSelect}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 9px",
        borderRadius: "7px",
        cursor: "pointer",
        background: isActive ? "#E6F4F3" : "transparent",
        color: isActive ? "#0B7A75" : "#334155",
        fontWeight: isActive ? 700 : 500,
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = "#F8FAFC";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1 }}>
        <MessageSquare
          style={{ width: "12px", height: "12px", color: isActive ? "#0B7A75" : "#94A3B8", flexShrink: 0 }}
        />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.title}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!isMenuOpen);
          }}
          style={{ padding: "2px", color: "#94A3B8", background: "none", border: "none", cursor: "pointer" }}
        >
          <MoreVertical style={{ width: "12px", height: "12px" }} />
        </button>

        {isMenuOpen && (
          <div
            style={{
              position: "absolute",
              right: "6px",
              top: "100%",
              marginTop: "2px",
              width: "90px",
              background: "#FFFFFF",
              borderRadius: "6px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
              border: "1px solid #E2E8F0",
              padding: "3px",
              zIndex: 40,
              fontSize: "11px",
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRename();
              }}
              style={{
                width: "100%",
                padding: "4px 6px",
                textAlign: "left",
                color: "#334155",
                background: "none",
                border: "none",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer",
              }}
            >
              <Edit2 style={{ width: "11px", height: "11px", color: "#94A3B8" }} />
              <span>重命名</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(e);
              }}
              style={{
                width: "100%",
                padding: "4px 6px",
                textAlign: "left",
                color: "#EF4444",
                background: "none",
                border: "none",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer",
              }}
            >
              <Trash2 style={{ width: "11px", height: "11px" }} />
              <span>删除</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// 专属业务类型卡片组件：标题 > 核心价格/工资/面积 > 区域/来源，标签弱化缩小避免抢焦点
function ResourceItemCard({ item }: { item: SearchSource }) {
  let badgeColor = "#0F766E";
  let badgeBg = "#F0FDF4";
  let typeLabel = "便民";

  if (item.type === "job") {
    badgeColor = "#0369A1";
    badgeBg = "#F0F9FF";
    typeLabel = "招聘";
  } else if (item.type === "house") {
    badgeColor = "#B45309";
    badgeBg = "#FFFBEB";
    typeLabel = "房产";
  } else if (item.type === "industrial") {
    badgeColor = "#1D4ED8";
    badgeBg = "#EFF6FF";
    typeLabel = "厂房";
  } else if (item.type === "service" || item.type === "provider") {
    badgeColor = "#6D28D9";
    badgeBg = "#F5F3FF";
    typeLabel = "师傅";
  } else if (item.type === "shop") {
    badgeColor = "#C2410C";
    badgeBg = "#FFF7ED";
    typeLabel = "好店";
  } else if (item.type === "listing") {
    badgeColor = "#047857";
    badgeBg = "#ECFDF5";
    typeLabel = "便民";
  }

  // 价格或薪资样式：面议用淡灰，数字价格用醒目品牌色/重点色
  const isNegotiable = !item.priceOrSalary || item.priceOrSalary.includes("面议");
  const priceColor = isNegotiable ? "#64748B" : item.type === "job" ? "#047857" : "#D97706";

  return (
    <Link href={item.url} className="yl-ai-resource-card">
      <div>
        {/* 1. 标题 (主视觉焦点) + 右上角微缩业务标签 */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "6px", marginBottom: "4px" }}>
          <h4
            style={{
              margin: 0,
              fontSize: "13.5px",
              fontWeight: 800,
              color: "#0F172A",
              lineHeight: 1.4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
            }}
          >
            {item.title}
          </h4>
          {/* 标签缩小至 9.5px，轻底色弱化，绝不抢占标题 */}
          <span
            style={{
              fontSize: "9.5px",
              fontWeight: 600,
              color: badgeColor,
              background: badgeBg,
              padding: "1px 5px",
              borderRadius: "3px",
              flexShrink: 0,
              lineHeight: 1.3,
            }}
          >
            {item.metaBadge || typeLabel}
          </span>
        </div>

        {/* 2. 核心价格 / 工资 / 租金 (次级突出) */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "2px" }}>
          <span style={{ fontSize: "13px", fontWeight: 800, color: priceColor }}>
            {item.priceOrSalary || "价格面议"}
          </span>
          {item.location && (
            <span
              style={{
                fontSize: "11px",
                color: "#64748B",
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
                marginLeft: "auto",
                maxWidth: "50%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <MapPin aria-hidden="true" focusable="false" style={{ width: "10.5px", height: "10.5px", flexShrink: 0, color: "#94A3B8" }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{item.location}</span>
            </span>
          )}
        </div>
      </div>

      {/* 3. 辅助说明与企业/来源 (弱化展示) */}
      {item.companyOrPublisher && (
        <div
          style={{
            marginTop: "6px",
            paddingTop: "5px",
            borderTop: "1px solid #F8FAFC",
            fontSize: "11px",
            color: "#94A3B8",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.companyOrPublisher}
        </div>
      )}
    </Link>
  );
}
