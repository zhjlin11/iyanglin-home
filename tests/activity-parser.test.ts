import assert from "node:assert";
import test from "node:test";
import { parseActivityBody, buildActivityBody } from "../src/lib/activity-parser";

test("A. Pure Chinese legacy intro without protocol headers", () => {
  const raw = "这是大学城周末草坪音乐节活动，欢迎各位同学自带吉他参加。";
  const parsed = parseActivityBody(raw);
  assert.strictEqual(parsed.intro, raw);
  assert.strictEqual(parsed.tags, undefined);
  const rebuilt = buildActivityBody(parsed);
  assert.strictEqual(rebuilt, raw);
});

test("B. Pure English legacy intro without protocol headers", () => {
  const raw = "This is a local campus concert event in Yanglin.";
  const parsed = parseActivityBody(raw);
  assert.strictEqual(parsed.intro, raw);
  assert.strictEqual(parsed.tags, undefined);
  const rebuilt = buildActivityBody(parsed);
  assert.strictEqual(rebuilt, raw);
});

test("C. Partial protocol headers + intro", () => {
  const raw = "【活动类型】outdoor\n【举办地点】杨林中央公园\n活动集合地点在公园正门大草坪。";
  const parsed = parseActivityBody(raw);
  assert.strictEqual(parsed.activityType, "outdoor");
  assert.strictEqual(parsed.location, "杨林中央公园");
  assert.strictEqual(parsed.intro, "活动集合地点在公园正门大草坪。");
});

test("D. Multi-line image URLs", () => {
  const raw = "【活动图片】\nhttps://example.com/a.jpg\nhttps://example.com/b.jpg\n\n活动精彩照片汇总";
  const parsed = parseActivityBody(raw);
  assert.deepStrictEqual(parsed.activityImages, ["https://example.com/a.jpg", "https://example.com/b.jpg"]);
  assert.strictEqual(parsed.intro, "活动精彩照片汇总");
});

test("E. Intro containing URLs, colons, linebreaks", () => {
  const raw = "【联系电话】13800000000\n\n活动官网: https://example.com/event\n注意事项:\n1. 请做好防晒\n2. 准时集合";
  const parsed = parseActivityBody(raw);
  assert.strictEqual(parsed.phone, "13800000000");
  assert.ok(parsed.intro.includes("https://example.com/event"));
  assert.ok(parsed.intro.includes("1. 请做好防晒"));
});

test("F. Cross-day event time ISO strings", () => {
  const raw = "【开始时间】2026-08-01T14:00:00+08:00\n【结束时间】2026-08-03T18:00:00+08:00\n跨天露营派对。";
  const parsed = parseActivityBody(raw);
  assert.strictEqual(parsed.startTime, "2026-08-01T14:00:00+08:00");
  assert.strictEqual(parsed.endTime, "2026-08-03T18:00:00+08:00");
});

test("G. Deadline earlier than start time", () => {
  const raw = "【开始时间】2026-08-01T14:00:00+08:00\n【报名截止】2026-07-31T23:59:59+08:00\n截止后不可报名。";
  const parsed = parseActivityBody(raw);
  assert.ok(new Date(parsed.deadline!).getTime() < new Date(parsed.startTime!).getTime());
});

test("H. Missing end time", () => {
  const raw = "【开始时间】2026-08-01T14:00:00+08:00\n开放式书友交流会。";
  const parsed = parseActivityBody(raw);
  assert.strictEqual(parsed.startTime, "2026-08-01T14:00:00+08:00");
  assert.strictEqual(parsed.endTime, undefined);
});

test("I. Preserve unknown protocol fields", () => {
  const raw = "【未知旧属性】保留数据\n正文描述";
  const parsed = parseActivityBody(raw);
  const rebuilt = buildActivityBody(parsed);
  assert.ok(rebuilt.includes("【未知旧属性】保留数据"));
});

test("J. Lossless parse -> build -> parse cycle", () => {
  const raw = "【活动类型】outdoor\n【组织者】杨林骑行社\n【活动费用】免费\n欢迎广大骑行爱好者。";
  const parsed1 = parseActivityBody(raw);
  const rebuilt = buildActivityBody(parsed1);
  const parsed2 = parseActivityBody(rebuilt);
  assert.strictEqual(parsed2.activityType, "outdoor");
  assert.strictEqual(parsed2.organizer, "杨林骑行社");
  assert.strictEqual(parsed2.feeType, "免费");
  assert.strictEqual(parsed2.intro, "欢迎广大骑行爱好者。");
});
