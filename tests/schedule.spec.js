import { expect, test } from "@playwright/test";

const TEST_DATE = "2026-05-26";
const TEST_TITLE = "E2E体验测试";
const TEST_TITLE_EDITED = "E2E体验测试已编辑";

async function cleanup(request) {
  const response = await request.get("/api/events?start=2026-05-01&end=2026-05-31");
  const payload = await response.json();
  await Promise.all(
    payload.events
      .filter((event) => event.title.startsWith(TEST_TITLE))
      .map((event) => request.delete(`/api/events/${event.id}`))
  );
}

test.beforeEach(async ({ request }) => {
  await cleanup(request);
});

test.afterEach(async ({ request }) => {
  await cleanup(request);
});

test("loads the calendar without card quote previews", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "日程管理" })).toBeVisible();
  await expect(page.getByTestId("day-cell")).toHaveCount(35);
  await expect(page.locator(".day-quote")).toHaveCount(0);
  await expect(page.locator(".weekly-panel")).toBeVisible();
});

test("creates, edits, filters, expands, and deletes an event", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("day-cell").filter({ has: page.locator(".day-number", { hasText: "26" }) }).click();
  await page.getByPlaceholder("事件标题").fill(TEST_TITLE);
  await page.getByLabel("开始时间").fill("09:00");
  await page.getByLabel("结束时间").fill("10:00");
  await page.getByPlaceholder("分类").fill("体验");
  await page.getByPlaceholder("地点").fill("本地浏览器");
  await page.getByPlaceholder("备注").fill("用于自动化验证");
  await page.getByRole("button", { name: "保存日程" }).click();

  await expect(page.getByText(TEST_TITLE)).toBeVisible();

  await page.getByRole("button", { name: "编辑" }).click();
  await page.locator(".edit-card input[name='title']").fill(TEST_TITLE_EDITED);
  await page.locator(".edit-card .save-edit").click();
  await expect(page.getByText(TEST_TITLE_EDITED)).toBeVisible();

  await page.getByLabel("搜索日程").fill(TEST_TITLE_EDITED);
  await page.keyboard.press("Enter");
  await expect(page.locator(".filter-status")).toContainText("已筛选");
  await expect(page.getByText(TEST_TITLE_EDITED)).toBeVisible();

  await page.getByTestId("day-cell").filter({ has: page.locator(".day-number", { hasText: "26" }) }).dblclick();
  await expect(page.locator(".focus-modal")).toBeVisible();
  await expect(page.locator(".focus-modal")).toContainText(TEST_TITLE_EDITED);
  await expect(page.locator(".focus-modal")).toContainText("09:00");
  await expect(page.locator(".focus-modal .focus-quote")).not.toBeEmpty();
  await page.getByTitle("关闭放大视图").click();

  await page.getByRole("button", { name: "删除" }).click();
  await page.getByRole("button", { name: "确认" }).click();
  await expect(page.getByText(TEST_TITLE_EDITED)).toHaveCount(0);
});
