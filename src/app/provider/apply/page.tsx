"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Upload,
  ArrowLeft,
  Building2,
  Phone,
  MessageSquare,
  MapPin,
  Sparkles,
  Award,
  BadgeCheck,
} from "lucide-react";
import { INFO_CATEGORIES } from "@/lib/info-categories";
import { DEFAULT_INFO_AREAS } from "@/lib/info-regions";

export default function ProviderApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingProvider, setExistingProvider] = useState<any>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 表单状态
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [serviceCategory, setServiceCategory] = useState("家政维修");
  const [serviceAreas, setServiceAreas] = useState<string[]>(["杨林经开区", "杨林大学城"]);
  const [phone, setPhone] = useState("");
  const [wechat, setWechat] = useState("");
  const [yearsOfService, setYearsOfService] = useState("3年+");
  const [address, setAddress] = useState("");
  const [intro, setIntro] = useState("");
  const [licenseImage, setLicenseImage] = useState("");
  const [verificationType, setVerificationType] = useState("SERVICE_VERIFIED");

  useEffect(() => {
    fetch("/api/provider/apply")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.provider) {
          const p = data.provider;
          setExistingProvider(p);
          setName(p.name || "");
          setAvatar(p.avatar || "");
          setServiceCategory(p.serviceCategory || "家政维修");
          setServiceAreas(Array.isArray(p.serviceAreas) ? p.serviceAreas : ["杨林经开区"]);
          setPhone(p.phone || "");
          setWechat(p.wechat || "");
          setYearsOfService(p.yearsOfService || "3年+");
          setAddress(p.address || "");
          setIntro(p.intro || "");
          setLicenseImage(p.licenseImages?.[0] || "");
          setVerificationType(p.verificationType || "SERVICE_VERIFIED");
        }
      })
      .catch((err) => console.error("Fetch provider apply error:", err))
      .finally(() => setLoading(false));
  }, []);

  const toggleArea = (areaName: string) => {
    if (serviceAreas.includes(areaName)) {
      setServiceAreas(serviceAreas.filter((a) => a !== areaName));
    } else {
      setServiceAreas([...serviceAreas, areaName]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setMessage({ type: "error", text: "请填写服务者姓名/店铺名和联系电话" });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/provider/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          avatar,
          serviceCategory,
          serviceAreas,
          phone,
          wechat,
          yearsOfService,
          address,
          intro,
          licenseImages: licenseImage ? [licenseImage] : [],
          verificationType,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "提交失败");
      }

      setExistingProvider(data.provider);
      setMessage({
        type: "success",
        text: "认证申请已成功提交！平台专员将在1个工作日内完成审核。",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "提交失败，请重试" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 flex items-center justify-center">
        <div className="text-slate-500 dark:text-slate-400 text-sm">正在加载认证资料...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
        {/* 返回导航 */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/info"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            返回便民大厅
          </Link>
          {existingProvider?.verificationStatus === "APPROVED" && (
            <Link
              href={`/provider/${existingProvider.id}`}
              className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
            >
              <BadgeCheck className="w-3.5 h-3.5 mr-1" />
              查看我的公开主页
            </Link>
          )}
        </div>

        {/* 顶部认证横幅卡片 */}
        <div
          style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #4338ca 50%, #0284c7 100%)" }}
          className="rounded-2xl p-6 text-white shadow-xl mb-6 relative overflow-hidden"
        >
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-inner">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  杨林生活网 · 服务者实名认证
                </h1>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black">
                  现阶段免费审核
                </span>
              </div>
              <p className="text-sm text-blue-100 mt-1 leading-relaxed">
                点亮专属「✓ 认证服务者」蓝V勋章，开通独立服务商主页，提升85%街坊咨询与成交信任度。
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/15 text-center text-xs">
            <div>
              <div className="font-bold text-base text-amber-300">✓ 官方背书</div>
              <div className="text-blue-100 text-[11px] mt-0.5">实名/营业执照核验</div>
            </div>
            <div>
              <div className="font-bold text-base text-amber-300">👑 专属主页</div>
              <div className="text-blue-100 text-[11px] mt-0.5">汇聚全部服务案例</div>
            </div>
            <div>
              <div className="font-bold text-base text-amber-300">🚀 流量倾斜</div>
              <div className="text-blue-100 text-[11px] mt-0.5">首页推荐与分类置顶</div>
            </div>
          </div>
        </div>

        {/* 现有申请状态提示条 */}
        {existingProvider && (
          <div className="mb-6">
            {existingProvider.verificationStatus === "PENDING" && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3 text-amber-800 dark:text-amber-200 text-sm">
                <Clock className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <div className="font-bold">认证审核中</div>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    您的认证材料已提交，平台管理员正加快审核中（一般1个工作日内完成）。如有需要修改可直接在下方编辑并重新提交。
                  </p>
                </div>
              </div>
            )}

            {existingProvider.verificationStatus === "APPROVED" && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start gap-3 text-emerald-800 dark:text-emerald-200 text-sm">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    恭喜！您已通过杨林生活网认证服务者审核
                    <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100">
                      正常生效中
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                    您的发布信息已自动带上认证标牌，并已开通专属服务者公开主页。
                  </p>
                </div>
              </div>
            )}

            {existingProvider.verificationStatus === "REJECTED" && (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-red-800 dark:text-red-200 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
                <div>
                  <div className="font-bold">认证未通过</div>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                    驳回原因: {existingProvider.rejectReason || "材料不齐全或不符合规范"}。请根据提示修改后重新提交。
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 成功/错误通知 */}
        {message && (
          <div
            className={`p-4 rounded-xl text-sm mb-6 flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* 表单卡片 */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6"
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              填写服务商基本资料
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              以下信息将展示在您的服务商专属主页上，供杨林街坊查看与联系。
            </p>
          </div>

          {/* 认证类型 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              认证类型
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${
                  verificationType === "SERVICE_VERIFIED"
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300"
                    : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="verificationType"
                  value="SERVICE_VERIFIED"
                  checked={verificationType === "SERVICE_VERIFIED"}
                  onChange={() => setVerificationType("SERVICE_VERIFIED")}
                  className="text-blue-600"
                />
                <span className="text-sm font-semibold">个人专业服务者</span>
              </label>
              <label
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${
                  verificationType === "MERCHANT_VERIFIED"
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300"
                    : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="verificationType"
                  value="MERCHANT_VERIFIED"
                  checked={verificationType === "MERCHANT_VERIFIED"}
                  onChange={() => setVerificationType("MERCHANT_VERIFIED")}
                  className="text-blue-600"
                />
                <span className="text-sm font-semibold">实体商户 / 企业机构</span>
              </label>
            </div>
          </div>

          {/* 服务者名称/店铺字号 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              服务商名称 / 店铺字号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 杨林水电快修 / 捷腾电脑数码维修中心"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 主营分类 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              主营服务分类 <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {INFO_CATEGORIES.map((cat) => {
                const isSelected = serviceCategory === cat.name;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setServiceCategory(cat.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 服务区域多选 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              覆盖服务片区 (可多选)
            </label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_INFO_AREAS.map((reg: any) => {
                const isChecked = serviceAreas.includes(reg.name);
                return (
                  <button
                    key={reg.name}
                    type="button"
                    onClick={() => toggleArea(reg.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isChecked
                        ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {isChecked ? "✓ " : "+ "}
                    {reg.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 联系电话与微信 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                服务电话 / 手机号 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="例: 13888888888"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                微信号 (选填)
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={wechat}
                  onChange={(e) => setWechat(e.target.value)}
                  placeholder="例: yanglin_service"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 从业年限与门店地址 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                从业年限 / 经验
              </label>
              <input
                type="text"
                value={yearsOfService}
                onChange={(e) => setYearsOfService(e.target.value)}
                placeholder="例: 5年专业经验 / 本地老店"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                经营地址 / 门店位置
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="例: 杨林经开区晨光路12号"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 团队特长与服务简介 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              服务特长与介绍
            </label>
            <textarea
              rows={3}
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              placeholder="介绍您的专业特长、服务承诺（如自带工具、急速30分钟上门、明码标价、假一赔十等）..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* 营业执照或资质材料图片 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              营业执照 / 身份证正面 / 职业资格证书图片链接 (平台严格保密)
            </label>
            <input
              type="url"
              value={licenseImage}
              onChange={(e) => setLicenseImage(e.target.value)}
              placeholder="请粘贴资质证书或营业执照图片 URL"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              注：证件照片仅用于后台专员审核身份核验，前台不对普通用户公开，请放心上传。
            </p>
          </div>

          {/* 提交按钮 */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>
                {submitting
                  ? "正在提交审核..."
                  : existingProvider
                  ? "更新并重新提交审核"
                  : "提交实名服务商认证"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
