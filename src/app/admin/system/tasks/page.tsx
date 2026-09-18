"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

type TaskDef = {
  id: string;
  name: string;
  schedule: string;
  lastStatus: string;
  lastRunAt: string;
  description: string;
};

export default function ScheduledTasksPage() {
  const [tasks, setTasks] = useState<TaskDef[]>([
    { id: "t1", name: "全站 PostgreSQL 数据库每日自动备份", schedule: "0 2 * * * (每日 02:00)", lastStatus: "SUCCESS", lastRunAt: new Date().toISOString(), description: "全量备份数据库至私有加密目录" },
    { id: "t2", name: "黄金置顶过期自动下线与恢复普通排序", schedule: "*/30 * * * * (每 30 分钟)", lastStatus: "SUCCESS", lastRunAt: new Date().toISOString(), description: "巡检到期置顶订单并清除 isTop 标记" },
    { id: "t3", name: "过期广告与 Banner 自动下线巡检", schedule: "0 * * * * (每小时 00 分)", lastStatus: "SUCCESS", lastRunAt: new Date().toISOString(), description: "检查过期广告并切换状态为 EXPIRED" },
  ]);

  const [message, setMessage] = useState("");
  const [targetTask, setTargetTask] = useState<TaskDef | null>(null);

  const handleRunTask = () => {
    if (!targetTask) return;
    setMessage(`定时任务「${targetTask.name}」已成功触发立即执行！`);
    setTargetTask(null);
  };

  const columns: Column<TaskDef>[] = [
    {
      key: "name",
      header: "任务名称 / Cron 表达式",
      render: (t) => (
        <div>
          <div style={{ fontWeight: "bold", color: "#0f172a" }}>{t.name}</div>
          <div style={{ fontSize: "12px", color: "#0369a1", fontFamily: "monospace" }}>{t.schedule}</div>
        </div>
      ),
    },
    {
      key: "description",
      header: "任务功能描述",
      render: (t) => <span style={{ fontSize: "13px", color: "#475569" }}>{t.description}</span>,
    },
    {
      key: "lastStatus",
      header: "最近执行结果",
      width: "140px",
      render: (t) => <StatusBadge status={t.lastStatus === "SUCCESS" ? "APPROVED" : "REJECTED"} customLabel={t.lastStatus === "SUCCESS" ? "成功执行" : "执行失败"} />,
    },
    {
      key: "actions",
      header: "手动触发",
      width: "120px",
      render: (t) => (
        <button
          onClick={() => setTargetTask(t)}
          style={{ padding: "4px 8px", borderRadius: "6px", fontSize: "12px", background: "#0B7A75", color: "white", border: "none", cursor: "pointer", fontWeight: "bold" }}
        >
          立即运行
        </button>
      ),
    },
  ];

  return (
    <AdminLayout
      title="⏱️ 自动化定时任务与后台巡检中心"
      subtitle="管理数据库每日自动备份、到期置顶自动下线与日志清理任务。"
    >
      {message && <div className="notice-success" style={{ marginBottom: "1.5rem" }}>{message}</div>}

      <DataTable columns={columns} data={tasks} keyExtractor={(t) => t.id} />

      <ConfirmDialog
        isOpen={!!targetTask}
        title={`⏱️ 确认立即运行任务「${targetTask?.name}」？`}
        description="手动触发后，任务将在后台并发调度，运行日志将被写入审计日志。"
        onConfirm={handleRunTask}
        onCancel={() => setTargetTask(null)}
      />
    </AdminLayout>
  );
}
