import assert from "node:assert";
import test from "node:test";
import { parseShopBody, buildShopBody } from "../src/lib/shop-parser";

test("Scenario A: Pure Chinese legacy intro without protocol headers", () => {
  const raw = "这是杨林本地老牌羊肉米线店，味道鲜美，欢迎到店品尝。";
  const parsed = parseShopBody(raw);
  assert.strictEqual(parsed.intro, raw);
  assert.strictEqual(parsed.services, undefined);
  assert.strictEqual(parsed.tags, undefined);

  const rebuilt = buildShopBody(parsed);
  assert.strictEqual(rebuilt, raw);
});

test("Scenario B: Pure English legacy intro without protocol headers", () => {
  const raw = "This is a test introduction for the shop...";
  const parsed = parseShopBody(raw);
  assert.strictEqual(parsed.intro, raw);
  assert.strictEqual(parsed.services, undefined);
  assert.strictEqual(parsed.tags, undefined);

  const rebuilt = buildShopBody(parsed);
  assert.strictEqual(rebuilt, raw);
});

test("Scenario C: Intro + 【服务项目】 protocol", () => {
  const raw = "【服务项目】炒菜 烧烤\n本店专注滇味家常菜。";
  const parsed = parseShopBody(raw);
  assert.strictEqual(parsed.services, "炒菜 烧烤");
  assert.strictEqual(parsed.intro, "本店专注滇味家常菜。");

  const rebuilt = buildShopBody(parsed);
  assert.ok(rebuilt.includes("【服务项目】炒菜 烧烤"));
  assert.ok(rebuilt.includes("本店专注滇味家常菜。"));
});

test("Scenario D: Intro + 【特色标签】 protocol", () => {
  const raw = "【特色标签】免费停车 24小时\n欢迎光临。";
  const parsed = parseShopBody(raw);
  assert.strictEqual(parsed.tags, "免费停车 24小时");
  assert.strictEqual(parsed.intro, "欢迎光临。");

  const rebuilt = buildShopBody(parsed);
  assert.ok(rebuilt.includes("【特色标签】免费停车 24小时"));
  assert.ok(rebuilt.includes("欢迎光临。"));
});

test("Scenario E: Intro with spaces, linebreaks, colons, URLs", () => {
  const raw = "【营业时间】09:00 - 22:00\n\n欢迎访问官网: https://example.com/shop\n电话: 13800000000\n\n详细说明: 本店提供 优质 服务。";
  const parsed = parseShopBody(raw);
  assert.strictEqual(parsed.hours, "09:00 - 22:00");
  assert.ok(parsed.intro.includes("https://example.com/shop"));
  assert.ok(parsed.intro.includes("详细说明: 本店提供 优质 服务。"));

  const rebuilt = buildShopBody(parsed);
  const reParsed = parseShopBody(rebuilt);
  assert.strictEqual(reParsed.hours, "09:00 - 22:00");
  assert.ok(reParsed.intro.includes("https://example.com/shop"));
});
