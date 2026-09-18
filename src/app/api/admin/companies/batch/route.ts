import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR"].includes(session.role)) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { ids, action } = body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "缺少选中的企业ID列表" }, { status: 400 });
  }

  let updateData: any = {};
  let actionLog = "BATCH_OPERATION";

  if (action === "SET_FEATURED") {
    updateData = { isFeaturedEmployer: true };
    actionLog = "COMPANY_BATCH_SET_FEATURED";
  } else if (action === "UNSET_FEATURED") {
    updateData = { isFeaturedEmployer: false };
    actionLog = "COMPANY_BATCH_UNSET_FEATURED";
  } else if (action === "ARCHIVE") {
    updateData = { status: "ARCHIVED" };
    actionLog = "COMPANY_BATCH_ARCHIVE";
  } else if (action === "DISABLE") {
    updateData = { status: "DISABLED" };
    actionLog = "COMPANY_BATCH_DISABLE";
  } else if (action === "ENABLE") {
    updateData = { status: "ACTIVE" };
    actionLog = "COMPANY_BATCH_ENABLE";
  } else {
    return NextResponse.json({ error: "不支持的批量操作指令" }, { status: 400 });
  }

  const res = await prisma.company.updateMany({
    where: { id: { in: ids } },
    data: updateData,
  });

  await prisma.operationLog.create({
    data: {
      userId: session.id,
      action: actionLog,
      metadata: {
        affectedCount: res.count,
        companyIds: ids,
        operator: session.username || session.id,
      },
    },
  }).catch(() => {});

  return NextResponse.json({
    success: true,
    affectedCount: res.count,
    message: `成功批量操作 ${res.count} 家企业主体`,
  });
}
