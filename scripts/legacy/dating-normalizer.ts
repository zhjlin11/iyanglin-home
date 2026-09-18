export interface RawDatingInput {
  index: number;
  nickname: string;
  gender?: string;
  age?: number | string;
  birthYear?: number;
  heightCm?: number | string;
  education?: string;
  occupation?: string;
  income?: string;
  maritalStatus?: string;
  location?: string;
  requirement?: string;
  intro?: string;
  photos?: string[];
  contact?: string;
}

export interface NormalizedDatingRecord {
  oldId: string;
  nickname: string;
  gender: "male" | "female";
  birthYear: number;
  heightCm: number;
  education: string;
  occupation: string;
  income: string;
  maritalStatus: string;
  location: string;
  requirement: string;
  intro: string;
  photos: string[];
  contact: string;
  status: "APPROVED" | "PENDING";
}

export function normalizeDatingRecord(raw: RawDatingInput): NormalizedDatingRecord {
  const indexStr = String(raw.index).padStart(3, "0");
  const oldId = `LEGACY_DATING_0723_${indexStr}`;

  // 1. Standardize gender
  let gender: "male" | "female" = "female";
  const rawGender = (raw.gender || "").toLowerCase();
  if (rawGender.includes("男") || rawGender.includes("male") || rawGender.includes("哥") || rawGender.includes("先生")) {
    gender = "male";
  }

  // 2. Standardize birthYear & age
  let birthYear = 1996;
  if (raw.birthYear && raw.birthYear >= 1950 && raw.birthYear <= 2010) {
    birthYear = Number(raw.birthYear);
  } else if (raw.age) {
    const ageNum = parseInt(String(raw.age).replace(/\D/g, ""), 10);
    if (!isNaN(ageNum) && ageNum >= 18 && ageNum <= 70) {
      birthYear = 2026 - ageNum;
    }
  }

  // 3. Standardize heightCm
  let heightCm = 168;
  if (raw.heightCm) {
    const hNum = parseInt(String(raw.heightCm).replace(/\D/g, ""), 10);
    if (!isNaN(hNum) && hNum >= 140 && hNum <= 210) {
      heightCm = hNum;
    }
  }

  // 4. Standardize contact phone
  const rawContact = raw.contact?.trim() || "";
  let cleanPhone = rawContact;
  const phoneMatch = rawContact.match(/1[3-9]\d{9}/);
  if (phoneMatch) {
    cleanPhone = phoneMatch[0];
  }

  // 5. Standardize properties
  const education = raw.education?.trim() || "本科";
  const occupation = raw.occupation?.trim() || "高校教师/企事业单位";
  const income = raw.income?.trim() || "6000-10000元/月";
  const maritalStatus = raw.maritalStatus?.trim() || "未婚";
  const location = raw.location?.trim() || "杨林大学城";
  const requirement = raw.requirement?.trim() || "希望对方性格开朗、孝顺父母、在杨林或昆明工作。";
  const intro = raw.intro?.trim() || `${raw.nickname.trim()}，目前在${location}工作，爱好旅游、阅读与美食。`;

  return {
    oldId,
    nickname: raw.nickname.trim(),
    gender,
    birthYear,
    heightCm,
    education,
    occupation,
    income,
    maritalStatus,
    location,
    requirement,
    intro,
    photos: raw.photos || [],
    status: "APPROVED",
    contact: cleanPhone,
  };
}
