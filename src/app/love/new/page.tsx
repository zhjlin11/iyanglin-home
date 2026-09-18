"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import ImageUpload from "@/components/ImageUpload";
import AuthGuard from "@/components/AuthGuard";

export default function NewDatingProfilePage() {
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const gender = String(data.get("gender") || "female").trim();
    const nickname = String(data.get("nickname") || "").trim();
    const birthYear = parseInt(String(data.get("birthYear") || "1998")) || 1998;
    const heightCm = parseInt(String(data.get("heightCm") || "165")) || 165;
    const education = String(data.get("education") || "本科").trim();
    const occupation = String(data.get("occupation") || "").trim();
    const income = String(data.get("income") || "5000-8000元/月").trim();
    const maritalStatus = String(data.get("maritalStatus") || "未婚").trim();
    const location = String(data.get("location") || "杨林本地").trim();
    const requirement = String(data.get("requirement") || "").trim();
    const intro = String(data.get("intro") || "").trim();
    const contact = String(data.get("contact") || "").trim();

    if (!nickname || !occupation || !intro || !requirement || !contact) {
      setMessage("请填写昵称、职业、个人介绍、择偶要求及联系方式");
      return;
    }

    setMessage("正在提交...");

    const response = await fetch("/api/love", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gender,
        nickname,
        birthYear,
        heightCm,
        education,
        occupation,
        income,
        maritalStatus,
        location,
        requirement,
        intro,
        contact,
        status: "pending",
        photos,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = `/login?from=${encodeURIComponent("/love/new")}`;
        return;
      }
      const res = await response.json().catch(() => ({}));
      setMessage(res.error || "提交失败，请稍后重试");
      return;
    }

    setMessage("资料登记成功，等待管理员审核后上线展示！");
    setTimeout(() => {
      window.location.href = "/love";
    }, 800);
  };

  return (
    <AuthGuard pageTitle="登记相亲交友资料">
      <main className="page-layout">
        <Navbar />
        <div className="shell editor-shell" style={{ marginTop: "2rem", paddingBottom: "4rem" }}>
        <div className="editor-heading">
          <div>
            <span className="eyebrow">相亲登记</span>
            <h1>登记个人相亲交友资料</h1>
            <p>真实填写真实个人信息与择偶条件，寻觅杨林本地有缘人。</p>
          </div>
          <button className="button button-primary" type="submit" form="love-form">提交资料</button>
        </div>

        {message ? (
          <div className={message.includes("失败") || message.includes("请") ? "notice-error" : "notice-success"} role="status">
            {message}
          </div>
        ) : null}

        <form id="love-form" className="editor-layout" onSubmit={submit}>
          <div className="editor-main">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <label>
                嘉宾性别
                <select name="gender" defaultValue="female">
                  <option value="female">👩 女嘉宾</option>
                  <option value="male">👨 男嘉宾</option>
                </select>
              </label>
              <label>
                显示昵称 (保护隐私)
                <input name="nickname" required placeholder="例如：林小姐 或 小王" />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <label>
                出生年份
                <input name="birthYear" type="number" defaultValue={1998} min={1960} max={2008} required />
              </label>
              <label>
                身高 (cm)
                <input name="heightCm" type="number" defaultValue={165} min={140} max={220} required />
              </label>
              <label>
                学历
                <select name="education" defaultValue="本科">
                  <option value="专科">专科</option>
                  <option value="本科">本科</option>
                  <option value="硕士">硕士</option>
                  <option value="博士及以上">博士及以上</option>
                </select>
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <label>
                职业 / 行业
                <input name="occupation" required placeholder="如：大学城教师 / 程序员" />
              </label>
              <label>
                月收入
                <select name="income" defaultValue="5000-8000元/月">
                  <option value="3000-5000元/月">3000-5000元/月</option>
                  <option value="5000-8000元/月">5000-8000元/月</option>
                  <option value="8000-12000元/月">8000-12000元/月</option>
                  <option value="15000元以上/月">15000元以上/月</option>
                </select>
              </label>
              <label>
                婚姻状况
                <select name="maritalStatus" defaultValue="未婚">
                  <option value="未婚">未婚</option>
                  <option value="离异无孩">离异无孩</option>
                  <option value="离异带孩">离异带孩</option>
                </select>
              </label>
            </div>

            <label>
              上传个人风采照片 (至少1张)
              <ImageUpload value={photos} onChange={setPhotos} maxCount={6} />
            </label>

            <label>
              自我介绍与生活爱好
              <textarea name="intro" className="body-editor" required rows={6} placeholder="简单说明您的性格特点、平时兴趣爱好、生活作息及价值观..." />
            </label>

            <label>
              心仪择偶标准
              <textarea name="requirement" className="body-editor" required rows={5} placeholder="描述您希望对方的年龄区间、身高、性格特征及生活期待..." />
            </label>
          </div>

          <aside className="editor-side">
            <div className="editor-card">
              <h2>🔒 隐私联系方式</h2>
              <label>
                联系手机 / 微信 (后台加密保护)
                <input name="contact" required placeholder="如：13800000000 (微信同号)" />
              </label>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px", lineHeight: "1.5" }}>
                为了保护您的隐私，手机号不会在公开页面直接展示，仅对平台认证有缘人提供申请。
              </p>
            </div>
          </aside>
        </form>
        </div>
      </main>
    </AuthGuard>
  );
}
