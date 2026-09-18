import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { isRateLimited, getClientIp } from "@/lib/rate-limiter";

// [AUDIT FIX P1-04] Image magic bytes validation
const IMAGE_SIGNATURES = [
  { name: "jpg", bytes: [0xFF, 0xD8, 0xFF] },
  { name: "png", bytes: [0x89, 0x50, 0x4E, 0x47] },
  { name: "gif", bytes: [0x47, 0x49, 0x46] },
  { name: "webp", bytes: [0x52, 0x49, 0x46, 0x46] },
  { name: "bmp", bytes: [0x42, 0x4D] },
];

function isValidImage(buffer: Buffer, ext: string): boolean {
  for (const sig of IMAGE_SIGNATURES) {
    if (buffer.length >= sig.bytes.length && sig.bytes.every((b, i) => buffer[i] === b)) {
      return true;
    }
  }
  if ((ext === "heic" || ext === "heif") && buffer.length > 8) {
    const ftyp = buffer.slice(4, 8).toString("ascii");
    if (ftyp === "ftyp") return true;
  }
  return false;
}

export async function POST(request: Request) {
  // Only authenticated users can upload images
  const user = await getSession(request);
  if (!user) {
    return NextResponse.json({ error: "请先登录后再上传图片" }, { status: 401 });
  }

  // [AUDIT FIX P1-01] Rate limiting: 30 uploads per 10 minutes per IP
  const clientIp = getClientIp(request);
  if (isRateLimited("upload", clientIp, 30, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "上传过于频繁，请稍后再试" }, { status: 429 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "未找到上传的文件" }, { status: 400 });
    }

    const fileType = file.type || "";
    const fileName = file.name || "";
    const isImage = fileType.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|bmp|heic|heif)$/i.test(fileName);

    if (!isImage) {
      return NextResponse.json({ error: "只能上传图片格式（JPG/PNG/WEBP/GIF）" }, { status: 400 });
    }

    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "单张图片大小不能超过 15MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";

    // [AUDIT FIX P1-04] Validate actual file content matches image format
    if (!isValidImage(buffer, ext)) {
      return NextResponse.json({ error: "文件内容不是有效的图片格式" }, { status: 400 });
    }
    const filename = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
    
    // Ensure uploads directory exists in public/uploads
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    
    // Write file
    const filePath = path.join(uploadsDir, filename);
    await fs.writeFile(filePath, buffer);

    const url = `/uploads/${filename}`;
    
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "图片上传失败，服务器写入异常" }, { status: 500 });
  }
}
