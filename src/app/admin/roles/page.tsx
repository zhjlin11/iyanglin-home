"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/admin/DataTable";

type RoleDef = {
  id: string;
  name: string;
  code: string;
  permissionsCount: number;
  usersCount: number;
  description: string;
  isSystem: boolean;
};

export default function RolesPage() {
  const roles: RoleDef[] = [
    { id: "1", name: "系统超级管理员 (ADMIN)", code: "ADMIN", permissionsCount: 48, usersCount: 1, description: "具备全站全部功能、商业配置、删除与系统运维最高控制权限", isSystem: true },
    { id: "2", name: "运营编辑 (EDITOR)", code: "EDITOR", permissionsCount: 32, usersCount: 1, description: "可发布、编辑、置顶便民内容与广告，无法修改支付密钥和高级系统配置", isSystem: true },
    { id: "3", name: "内容审核员 (REVIEWER)", code: "REVIEWER", permissionsCount: 16, usersCount: 1, description: "可查看全站内容与审核队列并执行通过/下线流转，无法删除与修改配置", isSystem: true },
    { id: "4", name: "普通注册用户 (USER)", code: "USER", permissionsCount: 8, usersCount: 1, description: "前台普通注册用户，仅具备发布便民内容、评论与收藏权限", isSystem: true },
  ];

  const columns: Column<RoleDef>[] = [
    {
      key: "name",
      header: "角色名称 / 编码",
      render: (r) => (
        <div>
          <div style={{ fontWeight: "bold", color: "#0f172a" }}>{r.name}</div>
          <div style={{ fontSize: "12px", color: "#64748b", fontFamily: "monospace" }}>Code: {r.code}</div>
        </div>
      ),
    },
    {
      key: "description",
      header: "权限范围描述",
      render: (r) => <span style={{ fontSize: "13px", color: "#334155" }}>{r.description}</span>,
    },
    {
      key: "permissionsCount",
      header: "绑定权限数",
      width: "110px",
      render: (r) => <span style={{ fontWeight: "bold", color: "#0B7A75" }}>{r.permissionsCount} 项</span>,
    },
    {
      key: "usersCount",
      header: "包含用户数",
      width: "110px",
      render: (r) => <span style={{ fontWeight: "bold", color: "#0369a1" }}>{r.usersCount} 人</span>,
    },
    {
      key: "status",
      header: "角色类型",
      width: "110px",
      render: (r) => <StatusBadge status="ACTIVE" customLabel={r.isSystem ? "系统核心" : "自定义"} />,
    },
  ];

  return (
    <AdminLayout
      title="🛡️ 动态角色与三维权限控制中心"
      subtitle="管理系统角色、菜单权限、按钮权限与 API 接口级权限分配。"
    >
      <DataTable columns={columns} data={roles} keyExtractor={(r) => r.id} />
    </AdminLayout>
  );
}
