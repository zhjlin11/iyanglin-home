"use client";

import { use, useEffect, useState } from "react";
import AdminNavbar from "@/components/AdminNavbar";
import ImageUpload from "@/components/ImageUpload";
import RichTextEditor from "@/components/RichTextEditor";
import { parseShopBody, buildShopBody, type ParsedShopBody } from "@/lib/shop-parser";
import { parseActivityBody, buildActivityBody, type ParsedActivityBody } from "@/lib/activity-parser";
import { parseJobBody, buildJobBody, type ParsedJobData } from "@/lib/job-parser";

type Item = {
  id: string;
  kind: "article" | "job" | "listing" | "house" | "shop" | "event" | "post" | "love";
  title: string;
  company?: string;
  category?: string;
  contact?: string;
  body: string;
  status: string;
  jobType?: string;
  area?: string;
  salary?: string;
  images?: string[];
  houseType?: string;
  price?: string;
  layout?: string;
  areaSize?: string;
  location?: string;
  address?: string;
  phone?: string;
  hours?: string;
  intro?: string;
  eventTime?: string;
  fee?: string;
  quota?: string;
  board?: string;
  nickname?: string;
  gender?: string;
  birthYear?: number;
  heightCm?: number;
  education?: string;
  occupation?: string;
  income?: string;
  maritalStatus?: string;
  requirement?: string;
};

// 预设杨林常见福利待遇标签
const COMMON_BENEFITS = [
  "包吃", "包住", "五险一金", "五险", "周末双休", "年终奖",
  "节日福利", "加班补助", "定期体检", "话费补贴", "交通补贴", "工龄奖"
];

// 预设薪资档位
const SALARY_PRESETS = [
  "面议", "3000-4500元/月", "4000-6000元/月", "5000-8000元/月",
  "6000-10000元/月", "8000-12000元/月", "150-200元/天", "200-300元/天"
];

// 预设工作地点片区
const AREA_PRESETS = [
  "杨林职教园区", "杨林工业园区", "领东国际商业街", "杨林古镇区", "嵩明县城", "昆明市区"
];

export default function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [item, setItem] = useState<Item | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [bodyContent, setBodyContent] = useState("");
  const [shopData, setShopData] = useState<ParsedShopBody | null>(null);
  const [activityData, setActivityData] = useState<ParsedActivityBody | null>(null);
  const [jobData, setJobData] = useState<ParsedJobData | null>(null);
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);
  const [customSalary, setCustomSalary] = useState("");
  const [customArea, setCustomArea] = useState("");

  useEffect(() => {
    fetch(`/api/content?id=${id}`)
      .then((response) => response.json())
      .then((data) => {
        const found = data.item || null;
        setItem(found);
        if (found) {
          setImages(found.images || []);
          if (found.kind === "shop") {
            setShopData(parseShopBody(found.body || ""));
          } else if (found.kind === "event") {
            setActivityData(parseActivityBody(found.body || found.intro || ""));
          } else if (found.kind === "job") {
            const parsed = parseJobBody(found.body || "");
            setJobData(parsed);
            setCustomSalary(found.salary || parsed.salary || "面议");
            setCustomArea(found.area || parsed.area || "杨林职教园区");
            if (parsed.benefits) {
              setSelectedBenefits(parsed.benefits.split(/[,，\s]+/).filter(Boolean));
            }
          } else {
            setBodyContent(found.body || "");
          }
        } else {
          setError("未检索到该内容详情");
        }
      })
      .catch(() => setError("内容加载失败"));
  }, [id]);

  if (!item) {
    return (
      <main className="admin-page">
        <div className="shell admin-shell">
          <p>{error || "正在加载内容..."}</p>
        </div>
      </main>
    );
  }

  const toggleBenefit = (tag: string) => {
    if (selectedBenefits.includes(tag)) {
      setSelectedBenefits(selectedBenefits.filter((t) => t !== tag));
    } else {
      setSelectedBenefits([...selectedBenefits, tag]);
    }
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setMessage("");
    setError("");

    const payload: any = {
      id: item.id,
      status: data.get("status"),
      images: images,
    };

    if (item.kind === "article") {
      payload.title = data.get("title");
      payload.category = data.get("category");
      payload.body = bodyContent;
    } else if (item.kind === "job") {
      payload.title = data.get("title");
      payload.company = data.get("company");
      payload.jobType = data.get("jobType");
      payload.area = customArea || data.get("area");
      payload.salary = customSalary || data.get("salary");
      payload.contact = data.get("job_contact");

      const updatedJobBody = buildJobBody({
        type: "job",
        jobTitle: data.get("title") as string,
        salary: (customSalary || data.get("salary")) as string,
        area: (customArea || data.get("area")) as string,
        experience: data.get("job_experience") as string,
        education: data.get("job_education") as string,
        benefits: selectedBenefits.join(" "),
        contact: data.get("job_contact") as string,
        description: data.get("job_description") as string,
      });
      payload.body = updatedJobBody;
    } else if (item.kind === "listing") {
      payload.title = data.get("title");
      payload.category = data.get("category");
      payload.contact = data.get("contact");
      payload.body = data.get("body");
    } else if (item.kind === "house") {
      payload.title = data.get("title");
      payload.houseType = data.get("houseType");
      payload.price = data.get("price");
      payload.layout = data.get("layout");
      payload.areaSize = data.get("areaSize");
      payload.location = data.get("location");
      payload.contact = data.get("contact");
      payload.body = data.get("body");
    } else if (item.kind === "shop") {
      payload.title = data.get("title");
      payload.category = data.get("category");
      payload.phone = data.get("phone");
      payload.address = data.get("address");
      payload.hours = data.get("hours");
      
      const newShopData: ParsedShopBody = {
        ...(shopData || ({} as ParsedShopBody)),
        category: (data.get("category") as string) || shopData?.category,
        address: (data.get("address") as string) || shopData?.address,
        hours: (data.get("hours") as string) || shopData?.hours,
        contact: (data.get("phone") as string) || shopData?.contact,
        membership: (data.get("shop_membership") as string) || shopData?.membership || "普通商家",
        verified: (data.get("shop_verified") as string) || shopData?.verified || "未认证",
        status: (data.get("shop_status") as string) || shopData?.status || "营业中",
        wechat: (data.get("shop_wechat") as string) || "",
        qq: (data.get("shop_qq") as string) || "",
        services: (data.get("shop_services") as string) || "",
        tags: (data.get("shop_tags") as string) || "",
        promotions: (data.get("shop_promotions") as string) || "",
        intro: (data.get("shop_intro") as string) || "",
        shopImages: data.get("shop_images") ? (data.get("shop_images") as string).split("\n").filter((l) => l.trim()) : shopData?.shopImages,
        caseImages: data.get("shop_case_images") ? (data.get("shop_case_images") as string).split("\n").filter((l) => l.trim()) : shopData?.caseImages,
      };
      payload.body = buildShopBody(newShopData);
    } else if (item.kind === "event") {
      payload.title = data.get("title");
      payload.category = data.get("category");
      payload.eventTime = data.get("eventTime");
      payload.location = data.get("location");
      payload.fee = data.get("fee");
      payload.quota = data.get("quota");
      payload.contact = data.get("contact");

      const newActData: ParsedActivityBody = {
        ...(activityData || ({} as ParsedActivityBody)),
        activityType: (data.get("category") as string) || activityData?.activityType,
        startTime: (data.get("eventTime") as string) || activityData?.startTime,
        location: (data.get("location") as string) || activityData?.location,
        feeType: (data.get("fee") as string) || activityData?.feeType,
        quota: (data.get("quota") as string) || activityData?.quota,
        phone: (data.get("contact") as string) || activityData?.phone,
        badge: (data.get("event_badge") as string) || activityData?.badge || "普通活动",
        signupStatus: (data.get("event_signupStatus") as string) || activityData?.signupStatus || "报名中",
        eventStatus: (data.get("event_eventStatus") as string) || activityData?.eventStatus || "正常",
        organizerType: (data.get("event_organizerType") as string) || activityData?.organizerType || "个人发起",
        intro: (data.get("event_intro") as string) || activityData?.intro || "",
      };
      payload.body = buildActivityBody(newActData);
    } else if (item.kind === "post") {
      payload.title = data.get("title");
      payload.board = data.get("board");
      payload.body = data.get("body");
    } else if (item.kind === "love") {
      payload.title = data.get("title");
      payload.gender = data.get("gender");
      payload.birthYear = Number(data.get("birthYear"));
      payload.heightCm = Number(data.get("heightCm"));
      payload.education = data.get("education");
      payload.occupation = data.get("occupation");
      payload.income = data.get("income");
      payload.maritalStatus = data.get("maritalStatus");
      payload.contact = data.get("contact");
      payload.body = data.get("body");
      payload.requirement = data.get("requirement");
    }

    const response = await fetch("/api/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(result.error || "保存失败，请稍后重试");
      return;
    }

    setItem(result.item);
    setMessage("✅ 职位与招聘属性已成功保存并实时生效！");
  };

  const kindNames: Record<string, string> = {
    article: "文章",
    job: "招聘职位",
    listing: "分类信息",
    house: "房产楼盘",
    shop: "好店商家",
    event: "本地活动",
    post: "社区贴子",
    love: "相亲嘉宾",
  };

  return (
    <main className="admin-page">
      <AdminNavbar />
      <div className="shell editor-shell" style={{ marginTop: "2rem", paddingBottom: "4rem" }}>
        <div className="editor-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <span className="eyebrow">全模块后台编辑</span>
            <h1 style={{ fontSize: "1.8rem", fontWeight: "bold" }}>编辑{kindNames[item.kind] || "内容"}</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>修改各项属性参数与配图，保存后即时全局生效。</p>
          </div>
          <div className="editor-actions" style={{ display: "flex", gap: "1rem" }}>
            <a className="button button-secondary" href="/admin/content">← 返回列表</a>
            <button className="button button-primary" type="submit" form="content-edit-form">保存修改</button>
          </div>
        </div>

        {message && <div className="notice-success" style={{ marginBottom: "1rem" }}>{message}</div>}
        {error && <div className="notice-error" style={{ marginBottom: "1rem" }}>{error}</div>}

        <form id="content-edit-form" className="editor-layout" onSubmit={save} style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "2rem" }}>
          <div className="editor-main" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            {/* 职位招聘专属结构化编辑器 (对齐老站 163kCMS) */}
            {item.kind === "job" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                
                {/* 1. 基础岗位属性 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <label style={{ fontWeight: "bold", color: "#0f172a" }}>
                    职位名称 <span style={{ color: "red" }}>*</span>
                    <input name="title" defaultValue={item.title} required style={{ width: "100%", padding: "0.6rem", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }} placeholder="如: 车间普工、行政文员、销售经理" />
                  </label>
                  <label style={{ fontWeight: "bold", color: "#0f172a" }}>
                    用人单位 / 公司名称 <span style={{ color: "red" }}>*</span>
                    <input name="company" defaultValue={item.company || "杨林本地企业"} required style={{ width: "100%", padding: "0.6rem", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }} placeholder="如: 云南沃莱德聚氨酯材料有限公司" />
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                  <label style={{ fontWeight: "bold", color: "#0f172a" }}>
                    招聘性质
                    <select name="jobType" defaultValue={item.jobType || "fulltime"} style={{ width: "100%", padding: "0.6rem", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                      <option value="fulltime">全职招聘</option>
                      <option value="parttime">兼职 / 大学生零工</option>
                      <option value="intern">实习生招聘</option>
                    </select>
                  </label>

                  <label style={{ fontWeight: "bold", color: "#0f172a" }}>
                    学历要求
                    <select name="job_education" defaultValue={jobData?.education || "不限"} style={{ width: "100%", padding: "0.6rem", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                      <option value="不限">不限</option>
                      <option value="初中及以下">初中及以下</option>
                      <option value="高中/中专">高中/中专</option>
                      <option value="大专">大专</option>
                      <option value="本科">本科</option>
                      <option value="硕士及以上">硕士及以上</option>
                    </select>
                  </label>

                  <label style={{ fontWeight: "bold", color: "#0f172a" }}>
                    经验要求
                    <select name="job_experience" defaultValue={jobData?.experience || "不限"} style={{ width: "100%", padding: "0.6rem", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                      <option value="不限">经验不限</option>
                      <option value="应届生">应届毕业生</option>
                      <option value="1年以内">1年以内</option>
                      <option value="1-3年">1-3年</option>
                      <option value="3-5年">3-5年</option>
                      <option value="5-10年">5-10年</option>
                      <option value="10年以上">10年以上</option>
                    </select>
                  </label>
                </div>

                {/* 2. 薪资待遇与片区 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ fontWeight: "bold", color: "#0f172a", display: "block", marginBottom: "4px" }}>
                      薪资待遇
                    </label>
                    <input
                      name="salary"
                      value={customSalary}
                      onChange={(e) => setCustomSalary(e.target.value)}
                      style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1", color: "#b45309", fontWeight: "bold" }}
                      placeholder="如: 4000-6000元/月"
                    />
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "6px" }}>
                      {SALARY_PRESETS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCustomSalary(p)}
                          style={{
                            fontSize: "11px", padding: "2px 6px", borderRadius: "4px", border: "1px solid #e2e8f0",
                            background: customSalary === p ? "#fef3c7" : "#f8fafc",
                            color: customSalary === p ? "#92400e" : "#64748b",
                            cursor: "pointer",
                          }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontWeight: "bold", color: "#0f172a", display: "block", marginBottom: "4px" }}>
                      工作地点 / 所属片区
                    </label>
                    <input
                      name="area"
                      value={customArea}
                      onChange={(e) => setCustomArea(e.target.value)}
                      style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      placeholder="如: 杨林职教园区"
                    />
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "6px" }}>
                      {AREA_PRESETS.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => setCustomArea(a)}
                          style={{
                            fontSize: "11px", padding: "2px 6px", borderRadius: "4px", border: "1px solid #e2e8f0",
                            background: customArea === a ? "#dcfce7" : "#f8fafc",
                            color: customArea === a ? "#166534" : "#64748b",
                            cursor: "pointer",
                          }}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. 热门福利待遇多选 */}
                <div>
                  <label style={{ fontWeight: "bold", color: "#0f172a", display: "block", marginBottom: "6px" }}>
                    福利待遇标签 (点击一键多选)
                  </label>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {COMMON_BENEFITS.map((tag) => {
                      const isChecked = selectedBenefits.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleBenefit(tag)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: isChecked ? "bold" : "normal",
                            border: isChecked ? "1px solid #0B7A75" : "1px solid #cbd5e1",
                            background: isChecked ? "#0B7A75" : "white",
                            color: isChecked ? "white" : "#475569",
                            cursor: "pointer",
                          }}
                        >
                          {isChecked ? `✓ ${tag}` : `+ ${tag}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. HR 联系方式 */}
                <label style={{ fontWeight: "bold", color: "#0f172a" }}>
                  HR 招聘联系方式 (电话 / 微信)
                  <input
                    name="job_contact"
                    defaultValue={jobData?.contact || item.contact || ""}
                    style={{ width: "100%", padding: "0.6rem", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    placeholder="如: 张经理 13888888888 (微信同号)"
                  />
                </label>

                {/* 5. 岗位职责与任职要求 */}
                <label style={{ fontWeight: "bold", color: "#0f172a" }}>
                  岗位职责与任职要求 (详细描述)
                  <textarea
                    name="job_description"
                    defaultValue={jobData?.description || item.body || ""}
                    rows={8}
                    style={{ width: "100%", padding: "0.75rem", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1", lineHeight: "1.6" }}
                    placeholder="请在此详细填写该岗位的具体工作内容、技能要求、工作时间及其他注意事项..."
                  />
                </label>
              </div>
            ) : (
              <>
                <label style={{ display: "block", fontWeight: "bold" }}>
                  {item.kind === "love" ? "嘉宾昵称" : item.kind === "shop" ? "商家名称" : "标题"}
                  <input name="title" defaultValue={item.title} required style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                </label>

                {/* Article category */}
                {item.kind === "article" && (
                  <label style={{ display: "block", fontWeight: "bold" }}>
                    文章分类
                    <select name="category" defaultValue={item.category || "life"} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }}>
                      <option value="life">本地生活</option>
                      <option value="guide">实用攻略</option>
                      <option value="notice">平台公告</option>
                    </select>
                  </label>
                )}

                {/* House Specific Fields */}
                {item.kind === "house" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <label style={{ fontWeight: "bold" }}>
                      房屋类型
                      <select name="houseType" defaultValue={item.houseType || "rent"} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }}>
                        <option value="rent">出租房</option>
                        <option value="secondhand">二手房</option>
                        <option value="newhouse">新房</option>
                        <option value="shop">商铺办公</option>
                      </select>
                    </label>
                    <label style={{ fontWeight: "bold" }}>
                      价格/租金
                      <input name="price" defaultValue={item.price || "面议"} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                    <label style={{ fontWeight: "bold" }}>
                      户型
                      <input name="layout" defaultValue={item.layout || "2室1厅"} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                    <label style={{ fontWeight: "bold" }}>
                      面积
                      <input name="areaSize" defaultValue={item.areaSize || "90㎡"} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                    <label style={{ fontWeight: "bold" }}>
                      位置/区域
                      <input name="location" defaultValue={item.location || "杨林地区"} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                    <label style={{ fontWeight: "bold" }}>
                      联系电话
                      <input name="contact" defaultValue={item.contact || ""} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                  </div>
                )}

                {/* Shop Specific Fields */}
                {item.kind === "shop" && shopData && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <label style={{ fontWeight: "bold" }}>
                      主营分类
                      <select name="category" defaultValue={item.category || "food"} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }}>
                        <option value="food">餐饮美食</option>
                        <option value="hotel">酒店住宿</option>
                        <option value="service">生活服务</option>
                        <option value="digital">电脑数码</option>
                        <option value="monitor">安防监控</option>
                        <option value="car">汽车服务</option>
                        <option value="decorate">装修建材</option>
                        <option value="beauty">美容美发</option>
                        <option value="education">教育培训</option>
                        <option value="express">快递物流</option>
                      </select>
                    </label>
                    <label style={{ fontWeight: "bold" }}>
                      联系电话
                      <input name="phone" defaultValue={item.phone || item.contact || ""} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                    <label style={{ fontWeight: "bold" }}>
                      详细地址
                      <input name="address" defaultValue={item.address || "杨林地区"} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                    <label style={{ fontWeight: "bold" }}>
                      营业时间
                      <input name="hours" defaultValue={item.hours || "09:00 - 21:00"} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                    
                    <label style={{ fontWeight: "bold" }}>
                      商家等级 (后台特权)
                      <select name="shop_membership" defaultValue={shopData.membership || "普通商家"} style={{ width: "100%", padding: "0.5rem", marginTop: "4px", border: "1px solid #ef4444", background: "#fef2f2" }}>
                        <option value="普通商家">普通商家</option>
                        <option value="金牌商家">金牌商家</option>
                        <option value="旗舰商家">旗舰商家</option>
                      </select>
                    </label>
                    <label style={{ fontWeight: "bold" }}>
                      认证状态 (后台特权)
                      <select name="shop_verified" defaultValue={shopData.verified || "未认证"} style={{ width: "100%", padding: "0.5rem", marginTop: "4px", border: "1px solid #10b981", background: "#ecfdf5" }}>
                        <option value="未认证">未认证</option>
                        <option value="已认证">已认证</option>
                        <option value="认证商家">认证商家</option>
                      </select>
                    </label>
                    <label style={{ fontWeight: "bold" }}>
                      营业状态
                      <select name="shop_status" defaultValue={shopData.status || "营业中"} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }}>
                        <option value="营业中">营业中</option>
                        <option value="休息中">休息中</option>
                      </select>
                    </label>
                    <label style={{ fontWeight: "bold" }}>
                      微信号 (可选)
                      <input name="shop_wechat" defaultValue={shopData.wechat || ""} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                    <label style={{ fontWeight: "bold" }}>
                      QQ客服 (可选)
                      <input name="shop_qq" defaultValue={shopData.qq || ""} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                    <label style={{ fontWeight: "bold" }}>
                      服务项目 (空格分隔)
                      <input name="shop_services" defaultValue={shopData.services || ""} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                    <label style={{ fontWeight: "bold", gridColumn: "span 2" }}>
                      特色标签 (空格分隔)
                      <input name="shop_tags" defaultValue={shopData.tags || ""} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                    <label style={{ fontWeight: "bold", gridColumn: "span 2" }}>
                      优惠活动
                      <textarea name="shop_promotions" defaultValue={shopData.promotions || ""} rows={2} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                    <label style={{ fontWeight: "bold", gridColumn: "span 2" }}>
                      商家介绍 (正文)
                      <textarea name="shop_intro" defaultValue={shopData.intro || ""} rows={6} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                    <label style={{ fontWeight: "bold", gridColumn: "span 2" }}>
                      门店图 (每行一个URL)
                      <textarea name="shop_images" defaultValue={shopData.shopImages?.join("\n") || ""} rows={4} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} placeholder="https://..." />
                    </label>
                    <label style={{ fontWeight: "bold", gridColumn: "span 2" }}>
                      案例图 (每行一个URL)
                      <textarea name="shop_case_images" defaultValue={shopData.caseImages?.join("\n") || ""} rows={4} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} placeholder="https://..." />
                    </label>
                  </div>
                )}

                {/* Event Specific Fields */}
                {item.kind === "event" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <label style={{ fontWeight: "bold" }}>
                      活动类型
                      <select name="category" defaultValue={item.category || "outdoor"} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }}>
                        <option value="outdoor">户外拓展</option>
                        <option value="sport">体育运动</option>
                        <option value="party">同城聚餐</option>
                        <option value="family">亲子活动</option>
                        <option value="training">技能培训</option>
                        <option value="charity">公益爱心</option>
                        <option value="jobfair">招聘双选</option>
                        <option value="camping">精致露营</option>
                      </select>
                    </label>
                    <label style={{ fontWeight: "bold" }}>
                      活动时间
                      <input name="eventTime" defaultValue={item.eventTime || activityData?.startTime || ""} placeholder="例如: 2026年8月1日 09:00–17:00 或 ISO格式" style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                    <label style={{ fontWeight: "bold" }}>
                      活动地点
                      <input name="location" defaultValue={item.location || activityData?.location || ""} placeholder="例如: 杨林大学城 · 中央公园大草坪" style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                    <label style={{ fontWeight: "bold" }}>
                      费用
                      <input name="fee" defaultValue={item.fee || activityData?.feeType || "免费"} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                    <label style={{ fontWeight: "bold" }}>
                      人数限制
                      <input name="quota" defaultValue={item.quota || activityData?.quota || "不限"} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                    <label style={{ fontWeight: "bold" }}>
                      联系电话 / 组织者
                      <input name="contact" defaultValue={item.contact || activityData?.phone || ""} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>

                    <label style={{ fontWeight: "bold" }}>
                      推荐标识 (后台特权)
                      <select name="event_badge" defaultValue={activityData?.badge || "普通活动"} style={{ width: "100%", padding: "0.5rem", marginTop: "4px", border: "1px solid #ef4444", background: "#fef2f2" }}>
                        <option value="普通活动">普通活动</option>
                        <option value="官方推荐">官方推荐</option>
                        <option value="热门活动">热门活动</option>
                        <option value="首页置顶">首页置顶</option>
                      </select>
                    </label>

                    <label style={{ fontWeight: "bold" }}>
                      报名状态 (后台控制)
                      <select name="event_signupStatus" defaultValue={activityData?.signupStatus || "报名中"} style={{ width: "100%", padding: "0.5rem", marginTop: "4px", border: "1px solid #10b981", background: "#ecfdf5" }}>
                        <option value="报名中">报名中</option>
                        <option value="即将满员">即将满员</option>
                        <option value="已满员">已满员</option>
                        <option value="已截止">已截止</option>
                      </select>
                    </label>

                    <label style={{ fontWeight: "bold" }}>
                      活动进行状态
                      <select name="event_eventStatus" defaultValue={activityData?.eventStatus || "正常"} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }}>
                        <option value="正常">正常</option>
                        <option value="已完成">已完成</option>
                        <option value="已取消">已取消</option>
                      </select>
                    </label>

                    <label style={{ fontWeight: "bold" }}>
                      主办方类型
                      <select name="event_organizerType" defaultValue={activityData?.organizerType || "个人发起"} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }}>
                        <option value="个人发起">个人发起</option>
                        <option value="校园社团">校园社团</option>
                        <option value="官方组织">官方组织</option>
                        <option value="商业机构">商业机构</option>
                      </select>
                    </label>

                    <label style={{ fontWeight: "bold", gridColumn: "span 2" }}>
                      活动详细说明 (正文)
                      <textarea name="event_intro" defaultValue={activityData?.intro || item.intro || item.body || ""} rows={6} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                  </div>
                )}

                {/* Dating Love Specific Fields */}
                {item.kind === "love" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                    <label style={{ fontWeight: "bold" }}>
                      性别
                      <select name="gender" defaultValue={item.gender || "female"} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }}>
                        <option value="female">女嘉宾</option>
                        <option value="male">男嘉宾</option>
                      </select>
                    </label>
                    <label style={{ fontWeight: "bold" }}>
                      出生年份
                      <input type="number" name="birthYear" defaultValue={item.birthYear || 1998} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                    <label style={{ fontWeight: "bold" }}>
                      身高(cm)
                      <input type="number" name="heightCm" defaultValue={item.heightCm || 165} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                    <label style={{ fontWeight: "bold" }}>
                      学历
                      <input name="education" defaultValue={item.education || "本科"} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                    <label style={{ fontWeight: "bold" }}>
                      职业
                      <input name="occupation" defaultValue={item.occupation || ""} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                    <label style={{ fontWeight: "bold" }}>
                      月收入
                      <input name="income" defaultValue={item.income || "面议"} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                    <label style={{ fontWeight: "bold" }}>
                      婚况
                      <input name="maritalStatus" defaultValue={item.maritalStatus || "未婚"} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                    <label style={{ fontWeight: "bold", gridColumn: "span 2" }}>
                      联系手机/微信
                      <input name="contact" defaultValue={item.contact || ""} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                    <label style={{ fontWeight: "bold", gridColumn: "span 3" }}>
                      心仪的TA (择偶要求)
                      <textarea name="requirement" defaultValue={item.requirement || ""} rows={3} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    </label>
                  </div>
                )}

                {/* Post Specific Fields */}
                {item.kind === "post" && (
                  <label style={{ display: "block", fontWeight: "bold" }}>
                    社区版块
                    <select name="board" defaultValue={item.board || "yanglin"} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }}>
                      <option value="yanglin">杨林爆料</option>
                      <option value="news">本地新闻</option>
                      <option value="help">我要求助</option>
                      <option value="life">吃喝玩乐</option>
                    </select>
                  </label>
                )}

                {/* Image Upload Component (Fallback / Main) */}
                <label style={{ display: "block", fontWeight: "bold", marginTop: "1rem" }}>
                  通用风采配图 (主图)
                  <ImageUpload value={images} onChange={setImages} maxCount={9} />
                </label>

                {/* Body Editor */}
                {item.kind !== "shop" && (
                  <label style={{ display: "block", fontWeight: "bold", marginTop: "1rem" }}>
                    {item.kind === "article" ? "正文内容" : "详细描述 / 自我介绍"}
                    {item.kind === "article" ? (
                      <RichTextEditor value={bodyContent} onChange={setBodyContent} />
                    ) : (
                      <textarea name="body" className="body-editor" defaultValue={item.body || item.intro || ""} required rows={10} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }} />
                    )}
                  </label>
                )}
              </>
            )}
          </div>

          <aside className="editor-side">
            <div className="editor-card" style={{ padding: "1.25rem", border: "1px solid var(--border)", borderRadius: "8px", background: "white" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: "0 0 1rem 0" }}>发布状态控制</h2>
              <label style={{ display: "block", fontWeight: "bold" }}>
                当前状态
                <select name="status" defaultValue={item.status} style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }}>
                  <option value="draft">草稿</option>
                  <option value="pending">待审核</option>
                  <option value="approved">已发布</option>
                  <option value="offline">已下线</option>
                </select>
              </label>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}
