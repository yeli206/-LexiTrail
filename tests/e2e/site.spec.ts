import { devices, expect, test } from "@playwright/test";

test("home and article lookup work without revealing translation on hover", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("把六级词汇");

  await page.goto("/articles/ai-agent-office");
  await page.waitForLoadState("networkidle");
  const word = page.locator('[data-word="automate"]').first();
  await word.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await word.hover();
  await page.waitForTimeout(300);
  const popover = page.locator(".word-popover");
  await expect(popover).toBeVisible();
  await expect(popover).toContainText("要用本地词典查询");
  await expect(popover).not.toContainText("使自动化");

  await popover.getByRole("button", { name: "查看释义" }).click();
  await expect(popover).toContainText("自动化");
});

test("double click saves a word locally and wordbook allows removal", async ({ page }) => {
  await page.goto("/articles/ai-agent-office");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('[data-word="software"]').first().dblclick();
  await expect(page.locator(".toast")).toContainText("已收藏 software");

  await page.goto("/wordbook");
  await expect(page.locator(".wordbook-row").filter({ hasText: "software" })).toBeVisible();
  await page.getByRole("button", { name: "删除 software" }).click();
  await expect(page.locator(".empty-state")).toContainText("单词本还是空的");
});

test("mobile tap opens actions and can save a word", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await context.newPage();
  await page.goto("/articles/body-clock-lab");
  await page.locator('[data-word="slumber"]').first().tap();
  const popover = page.locator(".word-popover");
  await expect(popover).toBeVisible();
  await popover.getByRole("button", { name: "加入单词本" }).click();
  await expect(page.locator(".toast")).toContainText("已收藏 slumber");
  await context.close();
});

test("coverage map filters and links a covered word back to its article", async ({ page }) => {
  await page.goto("/coverage");
  await expect(page.locator(".stat-block").first()).toContainText("已经出现过的词");
  await page.getByLabel("搜索词表").fill("unique");
  const row = page.locator(".coverage-word").filter({ hasText: "unique" });
  await expect(row).toBeVisible();
  await expect(row).toHaveAttribute("data-covered", "true");
  await row.getByRole("link", { name: "首次出现" }).click();
  await expect(page).toHaveURL(/impossible-objects-shelf/);
});

test("article catalogue groups entries and stores reading checks", async ({ page }) => {
  await page.goto("/articles");
  await expect(page.locator(".catalogue-section")).toHaveCount(5);
  const firstToggle = page.locator(".read-toggle").first();
  await firstToggle.click();
  await expect(page.locator(".catalogue-summary")).toContainText("1 / 45");
  await page.reload();
  await expect(page.locator(".read-toggle input").first()).toBeChecked();
});
