/**
 * Client-side WeChat JS-SDK helper
 * Dynamically loads https://res.wx.qq.com/open/js/jweixin-1.6.0.js and sets up share parameters.
 * Supports iOS WKWebView Entry URL signature matching and automatic retry.
 */

declare global {
  interface Window {
    wx?: any;
    __wxjs_environment?: string;
    __WX_ENTRY_URL__?: string;
  }
}

// 客户端首次加载时立即捕获入口 URL（针对 iOS 微信 WKWebView SPA 路由签名要求）
if (typeof window !== "undefined") {
  try {
    if (!window.__WX_ENTRY_URL__) {
      window.__WX_ENTRY_URL__ = window.location.href.split("#")[0];
    }
  } catch {}
}

export function isWechatBrowser(): boolean {
  if (typeof window === "undefined" || !window.navigator) return false;
  return /MicroMessenger/i.test(window.navigator.userAgent);
}

export function isIosDevice(): boolean {
  if (typeof window === "undefined" || !window.navigator) return false;
  return /iPhone|iPad|iPod/i.test(window.navigator.userAgent);
}

/**
 * 获取微信 JS-SDK 签名计算所用的最佳页面 URL
 * - iOS 微信 WKWebView: 始终使用进入应用时的 Entry URL
 * - Android 微信: 使用当前实时页面的 URL
 */
export function getWechatSignUrl(): string {
  if (typeof window === "undefined") return "";
  if (isIosDevice() && window.__WX_ENTRY_URL__) {
    return window.__WX_ENTRY_URL__;
  }
  return window.location.href.split("#")[0];
}

let jssdkLoadingPromise: Promise<any> | null = null;

export function loadWechatJssdkScript(): Promise<any> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.wx) return Promise.resolve(window.wx);
  if (jssdkLoadingPromise) return jssdkLoadingPromise;

  jssdkLoadingPromise = new Promise((resolve) => {
    const existing = document.getElementById("wx-jssdk-script") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(window.wx));
      existing.addEventListener("error", () => resolve(null));
      return;
    }

    const script = document.createElement("script");
    script.id = "wx-jssdk-script";
    script.src = "https://res.wx.qq.com/open/js/jweixin-1.6.0.js";
    script.async = true;
    script.onload = () => resolve(window.wx);
    script.onerror = () => {
      console.warn("[WeChat JS-SDK] Failed to load jweixin-1.6.0.js");
      resolve(null);
    };
    document.head.appendChild(script);
  });

  return jssdkLoadingPromise;
}

export interface WechatShareData {
  title: string;
  desc: string;
  link: string;
  imgUrl: string;
}

/**
 * 内部签名与注册执行函数
 */
async function configureWechatShare(wx: any, signUrl: string, shareData: WechatShareData): Promise<boolean> {
  try {
    const res = await fetch(`/api/wechat/jssdk?url=${encodeURIComponent(signUrl)}`);
    if (!res.ok) {
      console.warn("[WeChat JS-SDK] /api/wechat/jssdk returned", res.status);
      return false;
    }

    const json = await res.json();
    if (!json.success || !json.data) {
      console.warn("[WeChat JS-SDK] Config payload invalid:", json);
      return false;
    }

    const { appId, timestamp, nonceStr, signature } = json.data;

    return new Promise<boolean>((resolve) => {
      wx.config({
        debug: false,
        appId,
        timestamp,
        nonceStr,
        signature,
        jsApiList: [
          "updateAppMessageShareData",
          "updateTimelineShareData",
          "onMenuShareAppMessage",
          "onMenuShareTimeline",
          "showMenuItems",
        ],
        openTagList: [],
      });

      wx.ready(() => {
        try {
          if (typeof wx.showMenuItems === "function") {
            wx.showMenuItems({
              menuList: [
                "menuItem:share:appMessage",
                "menuItem:share:timeline",
                "menuItem:favorite",
              ],
            });
          }
        } catch {}

        const appPayload = {
          title: shareData.title,
          desc: shareData.desc,
          link: shareData.link,
          imgUrl: shareData.imgUrl,
          success: () => {},
        };

        const timelinePayload = {
          title: shareData.title,
          link: shareData.link,
          imgUrl: shareData.imgUrl,
          success: () => {},
        };

        // 1. 微信 JS-SDK 1.4.0+ 现代接口
        if (typeof wx.updateAppMessageShareData === "function") {
          wx.updateAppMessageShareData(appPayload);
        }
        if (typeof wx.updateTimelineShareData === "function") {
          wx.updateTimelineShareData(timelinePayload);
        }

        // 2. 微信旧版接口兜底（兼顾部分老版本微信客户端）
        if (typeof wx.onMenuShareAppMessage === "function") {
          wx.onMenuShareAppMessage(appPayload);
        }
        if (typeof wx.onMenuShareTimeline === "function") {
          wx.onMenuShareTimeline(timelinePayload);
        }

        resolve(true);
      });

      wx.error((err: any) => {
        console.warn("[WeChat JS-SDK] wx.error for URL:", signUrl, err);
        resolve(false);
      });
    });
  } catch (e) {
    console.warn("[WeChat JS-SDK] configureWechatShare exception:", e);
    return false;
  }
}

/**
 * 外部主调用：配置微信 JS-SDK 分享卡片
 * 自带 iOS 入口 URL 校验与实时当前 URL 降级双重保障
 */
export async function setupWechatShare(shareData: WechatShareData): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!isWechatBrowser()) return false;

  try {
    const wx = await loadWechatJssdkScript();
    if (!wx) return false;

    // 首选签名 URL (iOS 取 Entry URL，Android 取当前 URL)
    const primaryUrl = getWechatSignUrl();
    const ok = await configureWechatShare(wx, primaryUrl, shareData);

    // 如果首选 URL 失败，且当前 URL 与首选不同，则立即用当前实时 URL 进行二次重试兜底
    if (!ok) {
      const currentUrl = window.location.href.split("#")[0];
      if (currentUrl && currentUrl !== primaryUrl) {
        console.info("[WeChat JS-SDK] Primary signUrl failed, retrying with currentUrl:", currentUrl);
        await configureWechatShare(wx, currentUrl, shareData);
      }
    }

    return true;
  } catch (err) {
    console.warn("[WeChat JS-SDK] Setup failed gracefully:", err);
    return false;
  }
}
