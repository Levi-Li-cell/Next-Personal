import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const outDir = path.join(process.cwd(), "artifacts", "ui-check");
fs.mkdirSync(outDir, { recursive: true });

const checks = {
  authorEntryButton: false,
  noTopNavGeoLab: false,
  manualCityWeather: false,
  geoLabPageReachable: false,
  demoScriptRunning: false,
  webglCanvasVisible: false,
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.addInitScript(() => {
  try {
    sessionStorage.setItem("chat_guide_seen", "true");
  } catch {
    // ignore
  }
});

const page = await context.newPage();

try {
  await page.goto(`${baseUrl}/author`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(2000);

  checks.authorEntryButton = await page.getByRole("button", { name: "进入空间实验室" }).first().isVisible().catch(() => false);
  checks.noTopNavGeoLab = (await page.getByRole("navigation").first().textContent())?.includes("空间实验室") ? false : true;

  const cityInput = page.getByPlaceholder("输入城市名（如：井冈山、吉安、上海）");
  if (await cityInput.isVisible().catch(() => false)) {
    await cityInput.fill("上海");
    await page.getByRole("button", { name: "查询城市" }).first().click();
    await page.waitForTimeout(4500);
    const sourceTag = page.getByText("来源：手动查询", { exact: false }).first();
    const cityTag = page.getByText("城市：", { exact: false }).first();
    checks.manualCityWeather =
      (await sourceTag.isVisible().catch(() => false)) ||
      ((await cityTag.isVisible().catch(() => false)) && !(await page.getByText("天气加载失败", { exact: false }).first().isVisible().catch(() => false)));
  }

  await page.screenshot({ path: path.join(outDir, "author-page.png"), fullPage: true });

  const geoPage = await context.newPage();
  await geoPage.goto(`${baseUrl}/geo-lab`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await geoPage.getByText("空间分析实验室", { exact: false }).first().waitFor({ timeout: 30000 });
  checks.geoLabPageReachable = geoPage.url().includes("/geo-lab");

  const runBtn = geoPage.locator('button:has-text("运行案例脚本")').first();
  await runBtn.click({ force: true });
  await geoPage.waitForTimeout(2500);
  const runDisabled = await runBtn.isDisabled().catch(() => false);
  const pauseEnabled = await geoPage.locator('button:has-text("暂停脚本")').first().isEnabled().catch(() => false);
  await geoPage.waitForTimeout(4000);
  const pageText = await geoPage.locator("body").innerText();
  checks.demoScriptRunning =
    runDisabled ||
    pauseEnabled ||
    pageText.includes("案例脚本启动") ||
    pageText.includes("[Step") ||
    (pageText.includes("脚本状态：") && !pageText.includes("脚本状态：未运行"));

  const webglCanvasCount = await geoPage.locator("canvas").count();
  checks.webglCanvasVisible = webglCanvasCount > 0;

  await geoPage.screenshot({ path: path.join(outDir, "geo-lab-page.png"), fullPage: true });
  await geoPage.screenshot({ path: path.join(outDir, "geo-lab-after-demo.png"), fullPage: true });

  const ok = Object.values(checks).every(Boolean);
  const result = { ok, checks, screenshots: ["artifacts/ui-check/author-page.png", "artifacts/ui-check/geo-lab-page.png", "artifacts/ui-check/geo-lab-after-demo.png"] };
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = ok ? 0 : 1;
} catch (error) {
  console.error("UI verification failed:", error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
