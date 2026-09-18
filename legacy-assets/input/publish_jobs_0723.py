#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
2026-07-23 招聘发布
来源：
  A1: 人才多招聘网「昆明嵩明招聘信息栏（26.7月23日）」— 只录杨林岗位
  A2: 嵩明仕通人力「杨林地区招聘（7.22）」— 例外条款：只录杨林岗位，跳过仕通自身派遣
  A3: 嵩明县招聘「康希妈妈招聘」— 嵩明区域
时间策略：新岗位 2026-07-23 19:00+ 分钟错开，确保排在前面
"""
import requests, urllib.parse, time, json, sys, random
import subprocess, re

BASE = "https://www.yanglinol.com"
JAR  = r"C:\Windows\Temp\jar.txt"

sys.stdout.reconfigure(encoding='utf-8')

# ── Cookie ────────────────────────────────────────────────────
def load_cookies(jar_path):
    cookies = {}
    with open(jar_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"): continue
            parts = line.split("\t")
            if len(parts) >= 7:
                cookies[parts[5]] = parts[6]
    return cookies

COOKIES = load_cookies(JAR)
HEADERS = {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "Referer": f"{BASE}/sadmin/indexwap",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

def post(api, data):
    r = requests.post(f"{BASE}{api}", data=data, headers=HEADERS, cookies=COOKIES, timeout=15)
    return r.json()

def get(api):
    r = requests.get(f"{BASE}{api}", headers=HEADERS, cookies=COOKIES, timeout=15)
    return r.json()

# ── 公司查找/新建 ─────────────────────────────────────────────
def find_company(name):
    kw = urllib.parse.quote(name[:6])
    res = get(f"/api/JobCompany/GetAdminPageCompanys?PageSize=20&PageID=1&search={kw}")
    if isinstance(res, list):
        for c in res:
            if c.get("CompanyName") == name:
                return c["Id"]
    elif isinstance(res, dict) and res.get("Data"):
        for c in res["Data"]:
            if c.get("CompanyName") == name:
                return c["Id"]
    return None

def create_company(name, phone, address, quyuid, diduanid,
                   industry=3088, scale=3072, ctype=2981):
    data = urllib.parse.urlencode({
        "Id": "", "CompanyName": name, "Phone": phone,
        "Quyuid": quyuid, "Diduanid": diduanid,
        "Address": address, "TypeId": ctype, "IndustryId": industry,
        "ScaleId": scale, "RegisterNumber": "", "RegisterLicenseFilePath": "",
        "Logo": "", "GpsX": 0, "GpsY": 0, "Comment": ""
    })
    res = post("/api/JobCompany/JobCompanyAdminSubmit", data)
    print(f"  新建公司 {name}: {res}")
    time.sleep(0.5)
    cid = find_company(name)
    print(f"  → CompanyId={cid}")
    if cid:
        new_company_ids.append(cid)
    return cid

def get_or_create(name, phone=None, address=None, quyuid=3233, diduanid=3234,
                  industry=3088, scale=3072, ctype=2981):
    cid = find_company(name)
    if cid:
        print(f"  复用 {name} (Id={cid})")
        return cid
    return create_company(name, phone, address, quyuid, diduanid, industry, scale, ctype)

# ── 发布岗位 ──────────────────────────────────────────────────
job_ids = []
new_company_ids = []

STOP_KW = re.compile(
    r'(联系电话|联系方式|电话方式|咨询电话|微信号?|手机号?|tel\b|TEL\b'
    r'|电话\s*[:：]|联系\s*[:：]|工作地址|工作地点|地址\s*[:：]'
    r'|公司地址|面试地址|上班地址)', re.I)
PHONE_RE = re.compile(r'(?:\d{3,4}[-\s]?\d{7,8}|1[3-9]\d{9})')

def clean_desc(desc):
    lines = desc.split('\n')
    out = []
    for line in lines:
        if STOP_KW.search(line):
            break
        line = PHONE_RE.sub('', line)
        line = re.sub(r'\([微信同号]+\)|（微信同号）', '', line)
        out.append(line)
    return re.sub(r'\n{3,}', '\n\n', '\n'.join(out)).strip()

def publish(cid, cname, title, desc, cat1, cat2,
            salary=3339, edu=0, exp=0, welfares=""):
    d = clean_desc(desc)
    data = urllib.parse.urlencode({
        "JobId": "", "Id": cid, "CompanyName": cname,
        "Category1stId": cat1, "Category2ndId": cat2,
        "JobTitle": title, "JobDescription": d,
        "SalaryId": salary, "EducationId": edu, "ExperienceId": exp,
        "Welfares": welfares,
        "IsCustomerAddress": "false",
        "CustomerAddressRegionId": 0, "CustomerAddressSectionId": 0,
        "CustomerAddress": "", "CustomerAddressX": 0, "CustomerAddressY": 0,
        "HasExpired": "false", "ExpiredTime": "", "NeedResumeToPhone": "false",
        "PostPayType": 0
    })
    res = post("/api/JobPost/AddNewFullTimeJob", data)
    jid = res.get("data") if isinstance(res, dict) else None
    status = "✓" if jid else "✗"
    print(f"  {status} [{title}] → JobId={jid} | {res}")
    if jid:
        job_ids.append(jid)
    time.sleep(0.3)
    return jid

# ══════════════════════════════════════════════════════════════
# A1：人才多招聘网（7/23）—— 只录杨林地区岗位
# ══════════════════════════════════════════════════════════════

print("=" * 60)
print("A1-1. 物流公司（杨林恒宸工业区）")
cid = get_or_create("物流公司（杨林）", "13759143924",
                    "杨林恒宸工业区", 3231, 3232, 3548)
publish(cid, "物流公司（杨林）", "驾驶员（男，C1）",
        "要求有C1驾驶证，工资面议。\n工作地点：杨林恒宸工业区",
        3101, 3205, 3339, 0, 3000)

print("=" * 60)
print("A1-2. 杨林大学城校园外卖")
cid = get_or_create("杨林大学城校园外卖", "18006778483",
                    "昆明城市学院杨林校区内", 3233, 3234, 3548)
publish(cid, "杨林大学城校园外卖", "上楼员（校内配送）",
        "楼下接餐送到宿舍门口，不用出楼栋，月休两天，每月保底4000单，0.9元/单，月入5500-8000元。\n上手简单，新人带教，时间10:00-21:00。",
        3628, 3630, 2993, 0, 3218)
publish(cid, "杨林大学城校园外卖", "校园骑手",
        "食堂取餐送宿舍楼下，不用爬楼，免费提供电动车（不收押金/租金），综合月薪6000-7000元。\n工作时间10:00-21:00，兼职时间灵活，校内配送安全，单量稳定。",
        3628, 3630, 3584, 0, 3218)

print("=" * 60)
print("A1-3. 美迎家具椅子厂（缝纫工）")
cid = get_or_create("美迎家具椅子厂", "15287182178",
                    "昆明杨林美迎家具创业园十一幢", 3235, 3236, 3036)
publish(cid, "美迎家具椅子厂", "缝纫工（10名）",
        "工资计件，也可以带回家做，厂里提供机器。\n工作地址：昆明杨林美迎家具创业园十一幢",
        3093, 3786, 3339, 0, 0)

print("=" * 60)
print("A1-4. 定制家具厂（杨林）打包师傅")
cid = get_or_create("定制家具厂（杨林）", "13577079351",
                    "杨林工业园区", 3235, 3236, 3036)
publish(cid, "定制家具厂（杨林）", "打包师傅（2名，夫妻工优先）",
        "擦板带打包，最好夫妻工，保底10000+计件。\n要求吃苦耐劳，听从安排，不会勿扰。",
        3093, 3786, 2994, 0, 0)

print("=" * 60)
print("A1-5. 海绵厂（杨林）普工")
cid = get_or_create("海绵厂（杨林）", "13759566051",
                    "杨林小屯附近昊鑫酸菜鱼旁边", 3235, 3236, 3036)
publish(cid, "海绵厂（杨林）", "普工（2名）",
        "年龄30-40岁左右，要求在杨林四营周边优先，工资3000-4000元，加班另算。",
        3093, 3786, 3337, 0, 0)

print("=" * 60)
print("A1-6. 昆明昆城星餐饮管理有限公司")
cid = get_or_create("昆明昆城星餐饮管理有限公司", "17787263069",
                    "杨林大学城", 3233, 3234, 3028)
publish(cid, "昆明昆城星餐饮管理有限公司", "全职会计（1名）",
        "薪资3500-6000元，工作时间8:00-18:00，单休。\n岗位职责：日常财务核算与账务处理；按时完成税务申报；编制财务报表（资产负债表/利润表等）；配合成本费用核算与资金管理；参与月末、年末结账。",
        3098, 3182, 3582, 0, 0)

print("=" * 60)
print("A1-7. 华为手机导购（杨林大学城）")
cid = get_or_create("华为手机营销（杨林大学城）", "15198931452",
                    "杨林大学城", 3233, 3234, 3026)
publish(cid, "华为手机营销（杨林大学城）", "华为手机导购员",
        "薪资福利：竞争力薪酬+五险一金+赋能培训。\n岗位职责：承接并完成所在门店的销售目标，了解消费者需求，引导场景化互动体验，做好门店陈列与品牌形象维护，完成日常学习及新品培训。\n要求：高中及以上学历，有手机/电视/电脑等3C行业经验优先，主动担责，执行力强。",
        3092, 3552, 3339, 2995, 0, "3059")

print("=" * 60)
print("A1-8. 路灯厂（嵩明县杨林镇太平龙村）")
cid = get_or_create("路灯厂（杨林太平龙村）", "13888785004",
                    "昆明嵩明县杨林镇太平龙村", 3235, 3236, 3036, 3072, 2981)
publish(cid, "路灯厂（杨林太平龙村）", "普工（5名，夫妻工优先）",
        "保底3500-4000元。免费提供食宿，免费购买人身意外保险，要求长期稳定工作。",
        3093, 3786, 3337, 0, 0, "3055")
publish(cid, "路灯厂（杨林太平龙村）", "激光切割学徒（2名）",
        "保底4000-5000元，对激光切割技术感兴趣，学习能力强。免费提供食宿，免费购买人身意外保险。",
        3093, 3802, 3338, 0, 3218, "3055")
publish(cid, "路灯厂（杨林太平龙村）", "喷塑工（2名）",
        "保底月薪4000-4500元，熟练掌握喷塑工艺，能独立完成灯杆表面喷塑作业。免费提供食宿，免费购买人身意外保险。",
        3093, 3802, 3338, 0, 0, "3055")

print("=" * 60)
print("A1-9. 昆明恒福保温材料有限公司")
cid = get_or_create("昆明恒福保温材料有限公司", "15559666996",
                    "嵩明县杨林天桥新兴产业园1厂房", 3235, 3236, 3036)
publish(cid, "昆明恒福保温材料有限公司", "冷库板生产工（3名）",
        "要求18-48岁，身体健康，无不良嗜好。待遇包吃包住，3600-7000元。",
        3093, 3786, 3584, 0, 0, "3055")
publish(cid, "昆明恒福保温材料有限公司", "冷库板修板工（3名）",
        "要求18-48岁，身体健康，无不良嗜好。待遇包吃包住，3600-7000元。",
        3093, 3802, 3584, 0, 0, "3055")

print("=" * 60)
print("A1-10. 杨林食堂急聘帮厨")
cid = get_or_create("杨林大学城食堂", "13529434728",
                    "杨林大学城文林路18号", 3233, 3234, 3028)
publish(cid, "杨林大学城食堂", "帮厨（1人）",
        "上午8点上班，中午有休息时间，工资130元/天。",
        3426, 3693, 3339, 0, 0)

print("=" * 60)
print("A1-11. 杨林大学城水电工（个人）")
cid = get_or_create("杨林大学城水电维修", "15559830278",
                    "杨林大学城", 3233, 3234, 3026)
publish(cid, "杨林大学城水电维修", "水电工（1名）",
        "月休4天，要求懂水电，有工作经验优先，不包吃住，工资4000元/月。",
        3093, 3802, 3338, 0, 0)

print("=" * 60)
print("A1-12. 昆明木门厂（杨林）")
cid = get_or_create("昆明木门厂（杨林）", "15669049999",
                    "杨林工业园区", 3235, 3236, 3036)
publish(cid, "昆明木门厂（杨林）", "八开槽工（1名）",
        "工资待遇面议。",
        3093, 3786, 3339, 0, 0)
publish(cid, "昆明木门厂（杨林）", "杂工（1名）",
        "工资待遇面议。",
        3093, 3786, 3339, 0, 0)
publish(cid, "昆明木门厂（杨林）", "检验员（2名）",
        "熟悉木门，要求视力良好无色盲，工资待遇面议。",
        3098, 3186, 3339, 0, 0)
publish(cid, "昆明木门厂（杨林）", "品控主管（1名）",
        "要求多年木门生产品质管理经验，工资待遇面议。",
        3098, 3572, 3339, 0, 3002)

# ══════════════════════════════════════════════════════════════
# A2：嵩明仕通人力「杨林地区招聘（7.22）」
# 跳过：仕通自身派遣岗（邮政保安/幸福社区）、昆明昆仑保安（非杨林）
# 包含：其余工作地点在杨林的真实雇主
# ══════════════════════════════════════════════════════════════

print("=" * 60)
print("A2-1. 得胜温泉嵩明物业管理有限公司（杨林职教园）")
cid = get_or_create("得胜温泉嵩明物业管理有限公司", "19988739546",
                    "杨林职教园区得胜温泉度假公园", 3235, 3236, 3088, 3072, 2982)
publish(cid, "得胜温泉嵩明物业管理有限公司", "物业收费员（女，1名）",
        "薪资4500元/月。大专及以上学历（优秀者可放松），22-35岁，熟练电脑操作，会使用Excel台账；有收银、出纳或物业收费经验优先。工作时间9:00-18:00。\n生日节假日福利，五险一金。",
        3830, 3834, 3338, 2996, 0, "3059")

print("=" * 60)
print("A2-2. 屿都温泉度假酒店（杨林大学城，已有 Id=596）")
cid = find_company("屿都温泉度假酒店") or 596
print(f"  复用 Id={cid}")
publish(cid, "屿都温泉度假酒店", "服务员",
        "薪资面议，提供食宿，双休。",
        3426, 3683, 3339, 0, 0, "3055")
publish(cid, "屿都温泉度假酒店", "会计（1名，2年以上经验）",
        "具备扎实会计专业知识，熟悉财税法规，熟练操作财务软件，工作细致严谨。提供食宿，双休，工资面议。",
        3098, 3182, 3339, 2996, 3001, "3059,3055,3015")

print("=" * 60)
print("A2-3. 云南星壤农业科技有限公司（泰佳鑫标准厂房，杨林）")
cid = get_or_create("云南星壤农业科技有限公司", "18288741047",
                    "泰佳鑫标准厂房1栋（杨林工业园区）", 3231, 3232, 3036)
publish(cid, "云南星壤农业科技有限公司", "会计助理",
        "协助日常账务处理及财务基础工作，负责票据整理、凭证录入及档案管理，配合完成月度结账与财务报表准备，参与费用报销审核及资金收支记录，支持税务申报及合规事务。\n要求：熟悉办公软件，具备基本财务软件操作能力，有财务相关背景或实习经验者优先。",
        3098, 3182, 3339, 0, 0)
publish(cid, "云南星壤农业科技有限公司", "供应链会计",
        "负责供应链环节的会计核算及账务处理，审核采购/仓储/物流相关业务单据，协助月度成本核算与存货盘点对账，配合供应商往来账款核对及结算支持，支持供应链相关报表编制。\n要求：熟悉办公软件，具备财务软件操作能力。",
        3098, 3182, 3339, 0, 0)
publish(cid, "云南星壤农业科技有限公司", "新媒体运营",
        "负责抖音、小红书、视频号等平台账号日常运营，独立完成脚本构思、手机拍摄、剪映剪辑、发布上线。围绕鲜花饼、月饼、粽子等主营产品，策划种草短视频及节日营销内容，统计播放/点赞/转化数据，撰写产品文案及活动海报。\n要求：熟练使用剪映，能独立完成短视频拍摄与后期，具备基础文案能力。",
        3815, 3828, 3339, 0, 0)
publish(cid, "云南星壤农业科技有限公司", "普工（食品车间）",
        "负责鲜花饼、月饼流水线制作、包馅、成型、烘烤辅助、包装等基础生产工作，服从车间安排。\n薪资：女3200元/月+200全勤奖，男3500元/月+200全勤奖，按月准时发放。\n要求：身体健康，无传染性疾病，能办理食品行业健康证，年龄18-50周岁，新手有人带教。",
        3093, 3786, 3337, 0, 3218)

print("=" * 60)
print("A2-4. 云南来喜工贸（杨林）")
cid = get_or_create("云南来喜工贸有限公司", "15087124424",
                    "杨林工业园区", 3231, 3232, 3036)
publish(cid, "云南来喜工贸有限公司", "销售后勤（女，1名）",
        "大专以上学历，熟练使用办公软件、社交软件，会简单拍摄剪辑，能运营维护公众号/企业微信，具备一定文字编辑和表达能力，能吃苦耐劳，工作认真负责。薪资面议，08:00-18:00之间联系。",
        3092, 3552, 3339, 2996, 0)

print("=" * 60)
print("A2-5. 岳楼兰中式糖水店（杨林大学城莱雅广场）")
cid = get_or_create("岳楼兰中式糖水店", "19987849775",
                    "嵩明县杨林大学城莱雅广场", 3233, 3234, 3028)
publish(cid, "岳楼兰中式糖水店", "店员（多名）",
        "薪资4000元/月，责任心强，能吃苦耐劳，有工作经验优先，年龄20岁以上。",
        3091, 3104, 3338, 0, 0)

print("=" * 60)
print("A2-6. 杨林大学城临时帮厨（7月）")
cid = get_or_create("杨林大学城帮厨招聘", "13529434728",
                    "杨林大学城", 3233, 3234, 3028)
publish(cid, "杨林大学城帮厨招聘", "临时帮厨（限女性）",
        "年龄20岁-50岁，限女性，有工作经验优先，工资130元/天。",
        3426, 3693, 3339, 0, 0)

print("=" * 60)
print("A2-7. 云南千旺人防设备有限公司（杨林镇震海家具园）")
cid = get_or_create("云南千旺人防设备有限公司", "17787168839",
                    "嵩明县杨林镇震海家具园一期4栋", 3235, 3236, 3036)
publish(cid, "云南千旺人防设备有限公司", "资料员（1名）",
        "对接项目资料，整理单据，实时登记库存。要求28-40岁，熟练操作WPS等办公软件，学习能力强，有做人防资料员经验/大专以上学历优先。薪资3000-4500元，包吃，可买社保。工作时间：周一至周六8:00-12:00/13:30-18:00。",
        3098, 3186, 3337, 2996, 0, "3017")
publish(cid, "云南千旺人防设备有限公司", "数控设备操作工（1名）",
        "操作数控下料机，按图纸下料。要求：有数控设备操作相关经验，能看懂CAD图纸，会简单编辑简单图形，有责任心，有焊工证优先。薪资面谈，包吃，转正后可买社保。",
        3093, 3802, 3339, 0, 3000)
publish(cid, "云南千旺人防设备有限公司", "电焊工（2名）",
        "按图纸生产人防设备，能看懂CAD图纸，有责任心，有焊工证优先，有人防厂工作经验优先。薪资面谈，包吃，转正后可买社保。",
        3093, 3802, 3339, 0, 3000)

print("=" * 60)
print("A2-8. 云南厚稻管理有限公司（杨林大学城里外里，已有）")
cid = get_or_create("云南厚稻管理有限公司", "18488814867",
                    "杨林大学城里外里商业中心", 3233, 3234, 3088)
publish(cid, "云南厚稻管理有限公司", "办公室文员（1名）",
        "熟练使用办公软件，有新媒体运营相关经验者优先录用。薪资福利：购买五险，入职半年到手3500元/月。",
        3098, 3186, 3337, 0, 0, "3059")
publish(cid, "云南厚稻管理有限公司", "保洁（2名）",
        "年龄60周岁以下，身体健康。薪资2300-2800元/月。",
        3091, 3106, 2991, 0, 0)

print("=" * 60)
print("A2-9. 浙江中通通信有限公司（杨林经开区恒宸工业园）")
cid = get_or_create("浙江中通通信有限公司", "18787159394",
                    "杨林经济开发区恒宸工业园", 3231, 3232, 3036, 3072, 2982)
publish(cid, "浙江中通通信有限公司", "测试员（机顶盒/光猫/路由器）",
        "大专及以上学历，25-40岁，有电路基础，办公软件熟练。薪资3000-6000元/月，购买五险（两个月试用期后）。\n工作内容：机顶盒/光猫/路由器整机功能检测，通电测试，稳定性/兼容性/接口/开关机循环测试，记录台账，整理测试工位。",
        3098, 3186, 3582, 2996, 0, "3059")
publish(cid, "浙江中通通信有限公司", "文员（2名）",
        "熟练Excel/Word，有工作经验优先。薪资3000-6000元/月，购买五险（两个月试用期后）。",
        3098, 3186, 3582, 0, 0, "3059")
publish(cid, "浙江中通通信有限公司", "库管（2名）",
        "负责回收设备入库，区分保内/待翻新/报废货品，做好出入库登记及货品收发工作。薪资3000-6000元/月，购买五险（两个月试用期后）。",
        3628, 3648, 3582, 0, 0, "3059")

print("=" * 60)
print("A2-10. 昆明嘉丽泽物业（杨林镇，已有）")
cid = get_or_create("昆明嘉丽泽物业", "13698738218",
                    "嵩明县杨林镇昆明嘉丽泽农场恒大国际健康城", 3235, 3236, 3088, 3072, 2982)
publish(cid, "昆明嘉丽泽物业", "工程技工（2名）",
        "高中/中专及以上，持低压证优先。负责设备设施运行/巡视检查/维护保养/日常故障处理，业主报修问题及时处理，应急事件处理。工资4000-4500元，免费食宿，年假。",
        3093, 3802, 3338, 2995, 0, "3055,3015")

print("=" * 60)
print("A2-11. 嵩明锦和酒店（嵩明县杨林）")
cid = get_or_create("嵩明锦和酒店", "15198828402",
                    "嵩明县杨林锦和酒店", 3235, 3236, 3028)
publish(cid, "嵩明锦和酒店", "客房服务员",
        "做房，有经验者优先。薪资3000-6000元/月，工作时间8:00-17:00。",
        3426, 3700, 3582, 0, 0)
publish(cid, "嵩明锦和酒店", "前台服务员",
        "负责客人入住退房登记收银，有经验者优先。薪资3000-4000元/月，工作时间8:00-17:00。",
        3098, 3183, 3337, 0, 0)

print("=" * 60)
print("A2-12. 云南旭恒电力器材有限公司（杨林开发区，已有）")
cid = find_company("云南旭恒电力器材有限公司") or 629
print(f"  复用 Id={cid}")
publish(cid, "云南旭恒电力器材有限公司", "财务助理（兼出纳）",
        "主要负责出纳日常工作、往来账目核对，兼顾各类常规财务账务处理。有基础人事工作经验优先，工作细心严谨，具备良好数据核对能力，踏实稳定。薪资面议，入职缴纳五险，节日福利。",
        3098, 3182, 3339, 0, 0, "3059")
publish(cid, "云南旭恒电力器材有限公司", "标书制作专员",
        "全权负责招投标编制、资料封装线上申报，管理公司资质与各类人员证书；负责报价核算、票据整理及往来对账，归档项目合同台账。\n要求：具备1年标书独立编制经验，了解基础财务工作，熟练使用Office，有电力/铁塔行业标书经验优先。薪资面议，五险。",
        3098, 3186, 3339, 2996, 3000, "3059")

print("=" * 60)
print("A2-13. 忠兴港苑沟通100营业厅（杨林）")
cid = get_or_create("忠兴港苑沟通100营业厅", "15911317539",
                    "杨林忠兴港苑长乐坊商业区", 3235, 3236, 3026)
publish(cid, "忠兴港苑沟通100营业厅", "电话客服兼职（10人）",
        "薪资100元/天+现反奖励，上班时间9:00-12:00/14:00-18:00。\n负责移动产品销售及推广，协同做好客户服务。\n要求：高中以上，年龄20-40岁，思维灵活。",
        3092, 3553, 3339, 2995, 0)

print("=" * 60)
print("A2-14. 昆明云深物业管理有限公司（杨林大学城，已有）")
cid = find_company("昆明云深物业管理有限公司") or 611
print(f"  复用 Id={cid}")
publish(cid, "昆明云深物业管理有限公司", "员工食堂川菜厨师（1名）",
        "男性，50岁以内，5年厨房工作经验，持厨师证，有C1驾驶证，熟练驾驶车辆，有工厂/企业食堂经验优先，熟悉大锅菜烹饪。待遇：包吃，月休4天，购买五险，过节福利，工资面谈。",
        3426, 3693, 3339, 2995, 3002, "3059,3055,3015")
publish(cid, "昆明云深物业管理有限公司", "保洁（3名，男）",
        "年龄30-63周岁，男性，身体健康，纪律性强，能吃苦耐劳，熟练骑行三轮车，会使用保洁设备（洗地机等）优先。每天8小时，待遇2170元/月，月休4天，提供工作餐，可提供住宿。",
        3091, 3106, 2991, 0, 0, "3055,3017")

print("=" * 60)
print("A2-15. 杨林忠兴港苑商业区招商运营主管（昆明同禾商业管理，已有）")
cid = find_company("昆明同禾商业管理有限公司") or 615
print(f"  复用 Id={cid}")
publish(cid, "昆明同禾商业管理有限公司", "招商运营主管（1名）",
        "月薪10000元以上，具体面议。五险，周末双休，工作环境稳定。\n负责忠兴港苑商业街区整体招商规划、商户拓展、商务谈判及合同签约，完成招商指标；维护入驻商户关系，统筹后期日常运营管理，优化业态布局，提升出租率与经营氛围；开展市场调研、竞品分析，挖掘优质商家资源。\n要求：3-5年商业招商运营全职经验，有私企商业项目从业经历优先，自带商户资源者优先。",
        3098, 3572, 2994, 0, 3002, "3059,3015")
publish(cid, "昆明同禾商业管理有限公司", "煮饭阿姨",
        "年龄60周岁以下，身体健康。薪资2600元/月，周末单休时间自由。",
        3426, 3693, 2991, 0, 0)

print("=" * 60)
print("A2-16. 滇杰食品有限公司（杨林开发区官军路）")
cid = get_or_create("滇杰食品有限公司", "18988489462",
                    "杨林开发区官军路6号（云南农垦金汇粮油内）", 3231, 3232, 3036)
publish(cid, "滇杰食品有限公司", "普通工（数名，男女不限）",
        "薪资待遇到公司面谈。",
        3093, 3786, 3339, 0, 0)
publish(cid, "滇杰食品有限公司", "文员（2名）",
        "28-38岁，要有相关经验，思维灵活，具有较强的团队合作意识。薪资待遇到公司面谈。",
        3098, 3186, 3339, 0, 0)

print("=" * 60)
print("A2-17. 深圳金地物业管理有限公司嵩明分公司（已有）")
cid = find_company("深圳金地物业管理有限公司嵩明分公司") or 613
print(f"  复用 Id={cid}")
publish(cid, "深圳金地物业管理有限公司嵩明分公司", "催收专员（2名）",
        "负责物业费的催收工作。性格外向，抗压能力强，能接受高强度工作，有物业工作经历或催收经历优先。试用期3700元，转正3900元。商业保险，工作时间9:00-18:00，月休4天。",
        3092, 3553, 3337, 0, 0)

print("=" * 60)
print("A2-18. 浩洋冷冻设备有限公司（震海家具产业园2期，杨林）")
cid = get_or_create("浩洋冷冻设备有限公司", "18349361720",
                    "震海家具产业园2期（杨林）", 3235, 3236, 3036, 3072, 2981)
publish(cid, "浩洋冷冻设备有限公司", "库管（女，25-44岁）",
        "会电脑，心细，做事认真。薪资3000-4500元，购买社保。",
        3628, 3648, 3337, 0, 0, "3059")
publish(cid, "浩洋冷冻设备有限公司", "接单文员",
        "20-43岁，女性优先。薪资：试岗培育期两个月3500元，三月后底薪3000元+单体奖金+社保+提成，综合薪资8000-20000元/月。购买五险，高薪、高提成、奖金、节日福利、聚餐团建。",
        3092, 3553, 2994, 0, 0, "3059,3016")
publish(cid, "浩洋冷冻设备有限公司", "机械设计师（2名）",
        "大专及以上学历，持驾照，熟练运用AutoCAD及solidworks软件进行三维建模及出图，熟悉机加工及钣金加工工艺（箱柜及管道钣金）。购买社保，免费工作午餐，生日福利，年假。薪资面议。",
        3098, 3186, 3339, 2996, 3001, "3059,3015,3017")

# ══════════════════════════════════════════════════════════════
# A3：嵩明县招聘「康希妈妈」（嵩明滨河苑，Quyu=3239/3240）
# ══════════════════════════════════════════════════════════════

print("=" * 60)
print("A3-1. 康希妈妈（嵩明滨河苑D区）")
cid = get_or_create("康希妈妈女性健康管理", "18206937777",
                    "嵩明滨河苑D区商铺4号（康希妈妈女性第三空间）", 3239, 3240, 3026, 3072, 2980)
publish(cid, "康希妈妈女性健康管理", "门店综合运营助理（1名）",
        "上班时间08:30-18:30，月休4天。试用期2500元/月，转正后3000-5000元/月，转正后购买五险。\n岗位职责：客户预约/到店接待/签到登记/时间协调；跟进飞书待办，核对客户预约与工作安排；完善/更新客户档案，完成客户回访/生日关怀/信息维护；筹备服务物料，维持门店整洁有序；拍摄门店日常图片/短视频。\n要求：做事细心踏实，责任心强，眼里有活，主动性强，有前台/行政/客服/门店运营助理经验者优先，宝妈可报。",
        3091, 3104, 2992, 0, 0, "3059")
publish(cid, "康希妈妈女性健康管理", "功能训练师（康复方向，1名）",
        "上班时间08:30-18:30，月休4天。试用期2800元/月（带薪培训），转正薪资3000-10000元/月，转正后购买五险。\n以挪威Redcord红绳SET功能训练为主，专注体态矫正、产后康复、肌骨训练。应届生可培养，零基础可成长。\n岗位职责：参与门店系统化专业培训；在资深老师指导下协助客户体态健康评估与训练记录；开展产后运动养护、肌骨舒缓、日常功能运动指导；建立/完善客户训练档案。\n要求：运动康复/运动人体科学/健康管理/中医养生等相关专业优先；瑜伽普拉提教练/健身教练优先；大专及以上学历，应届生可培养。",
        3091, 3104, 2993, 2996, 3218, "3059")

# ══════════════════════════════════════════════════════════════
# 收尾：时间戳打散 + 汇报
# ══════════════════════════════════════════════════════════════

print("\n" + "=" * 60)
print(f"发布完成！共 {len(job_ids)} 个岗位")
print("job_ids:", job_ids)

if not job_ids:
    print("没有成功的岗位，跳过时间戳更新")
    import sys; sys.exit(0)

# 新岗位全部设到今天 19:00+ 分钟错开（保证排在最前）
base_ts = "2026-07-23 19:00:00"
import datetime

def ts(offset_min):
    t = datetime.datetime(2026, 7, 23, 19, 0, 0) + datetime.timedelta(minutes=offset_min)
    return t.strftime("%Y-%m-%d %H:%M:%S")

# 每个岗位错开 1-2 分钟
ts_list = [ts(i * 1) for i in range(len(job_ids))]

# 生成 SQL
cases_dt = "\n".join(f"  WHEN Id={jid} THEN '{t}'" for jid, t in zip(job_ids, ts_list))
sql = f"""
SET NOCOUNT ON;
UPDATE mh163k_Job_Post SET
  dtappenddate = CASE {cases_dt}
  ELSE dtappenddate END,
  updatetime = CASE {cases_dt}
  ELSE updatetime END,
  flushdate = CASE {cases_dt}
  ELSE flushdate END,
  LatestRefreshTime = CASE {cases_dt}
  ELSE LatestRefreshTime END,
  youxiao = 1,
  youxiaodate = '2026-12-31 23:59:59'
WHERE Id IN ({','.join(str(j) for j in job_ids)});
SELECT COUNT(*) AS updated FROM mh163k_Job_Post WHERE Id IN ({','.join(str(j) for j in job_ids)}) AND youxiao=1;
"""

# 生成 PS1：嵌入 SQL 内容，在远程直接写文件并执行
import os, subprocess, importlib.util

# 转义 SQL 中可能出现的单引号 (PowerShell here-string 不需转义)
ps1_local = r"C:\Windows\Temp\ts_update_0723.ps1"
ps1_content = f"""$sql = @'
{sql}
'@
$tmp = 'C:\\Windows\\Temp\\ts_update_0723.sql'
[System.IO.File]::WriteAllText($tmp, $sql, [System.Text.Encoding]::UTF8)
sqlcmd -S ".\\SQLEXPRESS" -d menhusql -U menhusql -P "123Ku_jhmen2lf8J*456" -C -i $tmp
"""
with open(ps1_local, "w", encoding="utf-8") as f:
    f.write(ps1_content)

run_ps = r"E:\Code\远程服务器\scripts\run_ps.py"
result = subprocess.run(
    ["python", run_ps, ps1_local, "30"],
    capture_output=True, text=True, timeout=90
)
print("TS update stdout:", result.stdout[:400])
if result.stderr:
    print("TS update stderr:", result.stderr[:200])

# 新建公司 IsShow=1
print("\n--- 新公司 IsShow 更新 ---")
print(f"新建公司 IDs: {new_company_ids}")
if new_company_ids:
    id_list = ','.join(str(i) for i in new_company_ids)
    isshow_sql = f"UPDATE mh163k_Job_Company SET IsShow=1 WHERE Id IN ({id_list});\nSELECT Id, CompanyName, IsShow FROM mh163k_Job_Company WHERE Id IN ({id_list});\n"
    ps1_isshow = r"C:\Windows\Temp\isshow_0723.ps1"
    ps1_isshow_content = f"""$sql = @'
{isshow_sql}
'@
$tmp = 'C:\\Windows\\Temp\\isshow_0723.sql'
[System.IO.File]::WriteAllText($tmp, $sql, [System.Text.Encoding]::UTF8)
sqlcmd -S ".\\SQLEXPRESS" -d menhusql -U menhusql -P "123Ku_jhmen2lf8J*456" -C -i $tmp
"""
    with open(ps1_isshow, "w", encoding="utf-8") as f:
        f.write(ps1_isshow_content)
    r2 = subprocess.run(["python", run_ps, ps1_isshow, "20"],
                        capture_output=True, text=True, timeout=60)
    print("IsShow update:", r2.stdout[:300])

# 百度推送
spec = importlib.util.spec_from_file_location(
    "baidu_push",
    r"E:\Code\远程服务器\articles\baidu_push.py"
)
bp_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bp_mod)
push_urls = bp_mod.push_urls

urls = [f"https://www.yanglinol.com/job/jobdetail_{jid}.html" for jid in job_ids[:10]]
push_result = push_urls(urls)
print(f"\n百度推送: {push_result}")

# Rollback SQL
rollback = f"-- Rollback 0723\nDELETE FROM mh163k_Job_Post WHERE Id IN ({','.join(str(j) for j in job_ids)});\n"
with open(r"E:\Code\远程服务器\_rollback_0723.sql", "w", encoding="utf-8") as f:
    f.write(rollback)
print("Rollback saved: _rollback_0723.sql")
