// Isolated regression suite: no production database, authentication, or Blob writes.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Module, { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { chromium } from "playwright";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const assetUrl = "https://teststore.public.blob.vercel-storage.com/games/html/test-game.html";
const state = { denied: false, existing: [], inserted: null, uploads: [], throwUpload: false };
globalThis.__gameTest = state;

const mockPlugin = {
  name: "isolated-server-dependencies",
  setup(bundler) {
    const mocks = {
      "@/lib/admin/game-auth": `export async function requireGameAdmin() { return globalThis.__gameTest.denied ? Response.json({success:false}, {status:403}) : null; }`,
      "@/db": `export const db = {
        select: () => ({ from: () => ({ where: () => ({ limit: async () => globalThis.__gameTest.existing }) }) }),
        insert: () => ({ values: (data) => { globalThis.__gameTest.inserted = data; return { returning: async () => [data] }; } }),
        update: () => ({ set: (data) => { globalThis.__gameTest.updated = data; return { where: () => ({returning: async () => [data]}) }; } }),
      };`,
      "@vercel/blob": `export async function put(name, bytes, options) {
        if (globalThis.__gameTest.throwUpload) throw new Error("Simulated storage failure");
        globalThis.__gameTest.uploads.push({name, size: bytes.length, options});
        return {url: ${JSON.stringify(assetUrl)}};
      }`,
    };
    bundler.onResolve({ filter: /^(@\/db$|@\/lib\/admin\/game-auth$|@vercel\/blob$)/ }, (args) => ({ path: args.path, namespace: "test-mock" }));
    bundler.onLoad({ filter: /.*/, namespace: "test-mock" }, (args) => ({ contents: mocks[args.path], loader: "js" }));
  },
};

async function loadModule(file, mock = false) {
  const output = await build({ entryPoints: [path.join(root, file)], absWorkingDir: root, bundle: true, write: false, platform: "node", format: "cjs", packages: "external", plugins: mock ? [mockPlugin] : [] });
  const mod = new Module(path.join(root, ".game-test.cjs"));
  mod.paths = require.resolve.paths("zod");
  mod._compile(output.outputFiles[0].text, mod.id);
  return mod.exports;
}

const assets = await loadModule("src/lib/game-assets.ts");
const { gameInputSchema } = await loadModule("src/lib/game-input.ts");
assert.equal(assets.validateGameHtmlFile({ name: "game.HTML", size: 1 }), null);
for (const file of [{ name: "x.js", size: 1 }, { name: "x.html", size: 0 }, { name: "x.htm", size: 4194305 }]) assert.ok(assets.validateGameHtmlFile(file));
for (const url of ["javascript:alert(1)", "//evil.test/a.png", "/\\evil.test/a", "https://", "https://user:pass@test.com/a"]) assert.equal(assets.isSafeGameUrl(url), false, url);
for (const url of ["/cover.png", "https://example.com/a.png", "http://localhost:3000/a.png"]) assert.equal(assets.isSafeGameUrl(url), true);
assert.equal(assets.isUploadedGameHtmlUrl(assetUrl), true);
for (const url of ["https://example.com/game.html", assetUrl.replace(".com/", ".com.evil.test/"), assetUrl.replace("/games/html/", "/author/"), assetUrl + "?x=1"]) assert.equal(assets.isUploadedGameHtmlUrl(url), false);

const validInput = { title: "Test HTML", slug: "test-html", description: "Test description", sceneType: "html-game", sceneConfig: { htmlUrl: assetUrl }, coverImage: "https://example.com/cover.png", status: "draft" };
assert.equal(gameInputSchema.safeParse(validInput).success, true);
assert.equal(gameInputSchema.safeParse({ ...validInput, sceneConfig: {} }).success, false);
assert.equal(gameInputSchema.safeParse({ ...validInput, coverImage: "javascript:alert(1)" }).success, false);
assert.equal(gameInputSchema.safeParse({ ...validInput, sceneType: "crystal-cluster", sceneConfig: {} }).success, true);

const upload = await loadModule("src/app/api/admin/games/upload/route.ts", true);
const games = await loadModule("src/app/api/admin/games/route.ts", true);
const game = await loadModule("src/app/api/admin/games/[id]/route.ts", true);
const request = (body, name = "game.html") => new Request(`http://localhost/api/admin/games/upload?filename=${name}`, { method: "POST", body });
const jsonRequest = (data, method = "POST") => new Request("http://localhost/api/admin/games", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
state.denied = true;
assert.equal((await upload.POST(request("test"))).status, 403);
assert.equal((await games.POST(jsonRequest(validInput))).status, 403);
state.denied = false;
assert.equal((await upload.POST(request("test", "bad.js"))).status, 400);
assert.equal((await upload.POST(request(""))).status, 400);
assert.equal((await upload.POST(request("not html"))).status, 400);
assert.equal((await upload.POST(request(new Uint8Array([255, 254])))).status, 400);
assert.equal((await upload.POST(request("x".repeat(4194305)))).status, 413);
const originalToken = process.env.BLOB_READ_WRITE_TOKEN;
try {
  delete process.env.BLOB_READ_WRITE_TOKEN;
  assert.equal((await upload.POST(request("<!doctype html><html><body>test</body></html>"))).status, 503);
  process.env.BLOB_READ_WRITE_TOKEN = "test-only-not-a-secret";
  assert.equal((await upload.POST(request("<!doctype html><html><body>test</body></html>"))).status, 200);
  assert.equal(state.uploads.length, 1);
  assert.match(state.uploads[0].name, /^games\/html\/.+\.html$/);
  state.throwUpload = true;
  assert.equal((await upload.POST(request("<html></html>"))).status, 500);
} finally {
  if (originalToken === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
  else process.env.BLOB_READ_WRITE_TOKEN = originalToken;
}
assert.equal((await games.POST(jsonRequest({ ...validInput, sceneConfig: {} }))).status, 400);
assert.equal((await games.POST(jsonRequest(validInput))).status, 200);
assert.equal(state.inserted.sceneConfig.htmlUrl, assetUrl);
assert.equal(state.inserted.coverImage, validInput.coverImage);
assert.equal(state.inserted.publishedAt, null);
assert.equal((await games.POST(jsonRequest({ ...validInput, status: "published" }))).status, 200);
assert.ok(state.inserted.publishedAt instanceof Date);
state.existing = [{ ...state.inserted, id: "existing" }];
assert.equal((await games.POST(jsonRequest(validInput))).status, 400);
assert.equal((await game.PUT(jsonRequest({ createdAt: "2026-10-01T00:00:00Z" }, "PUT"), { params: Promise.resolve({ id: "existing" }) })).status, 200);
assert.equal((await game.PUT(jsonRequest({ sceneConfig: {} }, "PUT"), { params: Promise.resolve({ id: "existing" }) })).status, 400);
console.log("PASS: file validation, URL validation, authorization gate, upload failures, save/publish, duplicate slug, time editing");

const fixtureHtml = `<!doctype html><html><body style="margin:0;background:#176f56;color:white;font:24px sans-serif"><canvas id="scene" width="320" height="160"></canvas><button id="play">Play</button><p id="score">0</p><script>const c=document.querySelector('canvas').getContext('2d');c.fillStyle='#f2ce56';c.fillRect(20,20,280,120);document.querySelector('#play').onclick=()=>document.querySelector('#score').textContent='1';try{parent.document.body.dataset.escaped='yes'}catch{document.body.dataset.isolated='yes'}</script></body></html>`;
const browserBundle = await build({
  stdin: { contents: `import React, {useRef} from 'react'; import {createRoot} from 'react-dom/client'; import Page from './src/app/(admin)/admin/games/page'; import HtmlGame from './src/components/games/HtmlGame'; import {Toaster} from 'sonner'; function Player(){const ref=useRef(null);return <><button onClick={()=>ref.current?.toggleFullscreen()}>Fullscreen</button><HtmlGame ref={ref} url=${JSON.stringify(assetUrl)} title="Player test"/></>;} createRoot(document.getElementById('root')).render(<>{location.pathname === '/player' ? <Player/> : <Page/>}<Toaster/></>);`, resolveDir: root, loader: "tsx" },
  absWorkingDir: root, bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", define: { "process.env.NODE_ENV": '"production"', "process.env": "{}" },
});
const cssPath = path.join(root, "src/app/globals.css");
const css = (await postcss([tailwindcss()]).process(await readFile(cssPath, "utf8"), { from: cssPath })).css;
const cover = await readFile(path.join(root, "public/liwei/images/abyssal-well-cover.png"));
const server = createServer((req, res) => {
  if (req.url === "/app.js") { res.setHeader("Content-Type", "text/javascript"); res.end(browserBundle.outputFiles[0].text); }
  else if (req.url === "/style.css") { res.setHeader("Content-Type", "text/css"); res.end(css); }
  else if (req.url === "/cover.png") { res.setHeader("Content-Type", "image/png"); res.end(cover); }
  else { res.setHeader("Content-Type", "text/html; charset=utf-8"); res.end('<!doctype html><html lang="zh-CN"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/style.css"><body style="padding:16px"><div id="root"></div><script src="/app.js"></script></body></html>'); }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const screenshots = process.env.GAME_TEST_OUTPUT || path.join(tmpdir(), "game-management-tests");
await mkdir(screenshots, { recursive: true });
let browser;
try {
  browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || (existsSync(chromium.executablePath()) ? undefined : "chrome") });
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", (error) => { errors.push(error.message); console.error("Browser error:", error.message); });
    let submitted;
    let failUpload = true;
    await page.route("**/api/admin/games**", async (route) => {
      const req = route.request();
      if (req.url().includes("/upload")) {
        if (failUpload) { await route.fulfill({ status: 500, json: { success: false, error: "Upload failed test" } }); return; }
        await new Promise((resolve) => setTimeout(resolve, 300));
        await route.fulfill({ json: { success: true, data: { url: assetUrl } } });
      } else if (req.method() === "POST") {
        submitted = req.postDataJSON();
        await route.fulfill({ json: { success: true, data: { ...submitted, id: "new" } } });
      } else await route.fulfill({ json: { success: true, data: [], pagination: { total: 0, totalPages: 0 } } });
    });
    await page.route(assetUrl, (route) => route.fulfill({ contentType: "text/plain", headers: { "Access-Control-Allow-Origin": "*" }, body: fixtureHtml }));
    await page.goto(base);
    await page.getByRole("button", { name: "新增游戏", exact: true }).click();
    await page.getByLabel("游戏名称", { exact: false }).fill("HTML Test");
    await page.getByRole("button", { name: "生成", exact: true }).click();
    await page.getByLabel("游戏说明", { exact: false }).fill("Test description");
    await page.getByLabel("封面图 URL", { exact: true }).fill(`${base}/cover.png`);
    await page.getByRole("button", { name: "创建游戏", exact: true }).click();
    await page.getByText("请先上传 HTML 游戏文件", { exact: true }).waitFor();
    const fileInput = page.getByLabel("上传 HTML 游戏文件", { exact: true });
    await fileInput.setInputFiles({ name: "bad.txt", mimeType: "text/plain", buffer: Buffer.from("test") });
    await page.getByText("请选择 .html 或 .htm 文件", { exact: true }).waitFor();
    await fileInput.setInputFiles({ name: "game.html", mimeType: "text/html", buffer: Buffer.from(fixtureHtml) });
    await page.getByText("Upload failed test", { exact: true }).waitFor();
    failUpload = false;
    await fileInput.setInputFiles({ name: "game.html", mimeType: "text/html", buffer: Buffer.from(fixtureHtml) });
    await page.getByRole("button", { name: "上传中...", exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "上传中...", exact: true }).isDisabled(), true);
    await page.getByText("game.html · 已上传", { exact: true }).waitFor();
    await page.getByRole("button", { name: "预览游戏", exact: true }).click();
    const frame = page.frameLocator('iframe[title="HTML 游戏预览"]');
    await frame.getByRole("button", { name: "Play", exact: true }).click();
    assert.equal(await frame.locator("#score").textContent(), "1");
    assert.equal(await frame.locator("body").getAttribute("data-isolated"), "yes");
    assert.equal(await page.locator("body").getAttribute("data-escaped"), null);
    const pixel = await frame.locator("canvas").evaluate((canvas) => Array.from(canvas.getContext("2d").getImageData(40, 40, 1, 1).data));
    assert.deepEqual(pixel, [242, 206, 86, 255]);
    assert.equal(await page.getByAltText("游戏封面预览").evaluate((img) => img.complete && img.naturalWidth > 0), true);
    const dialog = page.getByRole("dialog");
    assert.equal(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth), true);
    await page.getByRole("button", { name: "替换 HTML 文件", exact: true }).scrollIntoViewIfNeeded();
    const filenameBounds = await page.getByText("game.html · 已上传", { exact: true }).boundingBox();
    assert.ok(filenameBounds && filenameBounds.width > 0 && filenameBounds.x >= 0);
    await page.screenshot({ path: path.join(screenshots, `game-form-${viewport.width}.png`), animations: "disabled" });
    await page.getByRole("button", { name: "创建游戏", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    assert.equal(submitted.sceneType, "html-game");
    assert.equal(submitted.sceneConfig.htmlUrl, assetUrl);
    assert.equal(submitted.coverImage, `${base}/cover.png`);
    assert.equal(submitted.slug, "html-test");
    await page.getByRole("button", { name: "新增游戏", exact: true }).click();
    await page.getByLabel("游戏名称", { exact: false }).fill("Built in");
    await page.getByRole("button", { name: "生成", exact: true }).click();
    await page.getByLabel("游戏说明", { exact: false }).fill("Built-in scene");
    await page.getByRole("combobox").filter({ hasText: "HTML 游戏" }).click();
    await page.getByRole("option", { name: "晶体簇", exact: true }).click();
    await page.getByRole("button", { name: "创建游戏", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    assert.equal(submitted.sceneType, "crystal-cluster");
    assert.deepEqual(submitted.sceneConfig, {});
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS: ${viewport.width}px form, upload failure/retry, submit lock, cover preview, HTML interaction, sandbox, canvas pixels, saved payload`);
  }
  const playerPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  let failLoad = true;
  await playerPage.route(assetUrl, (route) => failLoad
    ? route.fulfill({ status: 404, body: "missing", headers: { "Access-Control-Allow-Origin": "*" } })
    : route.fulfill({ contentType: "text/plain", headers: { "Access-Control-Allow-Origin": "*" }, body: fixtureHtml }));
  await playerPage.goto(`${base}/player`);
  await playerPage.getByText("游戏文件加载失败", { exact: true }).waitFor();
  failLoad = false;
  await playerPage.getByRole("button", { name: "重试", exact: true }).click();
  await playerPage.frameLocator("iframe").getByRole("button", { name: "Play", exact: true }).waitFor();
  await playerPage.getByRole("button", { name: "Fullscreen", exact: true }).click();
  await playerPage.getByRole("button", { name: "退出全屏", exact: true }).waitFor();
  assert.equal(await playerPage.evaluate(() => !!document.fullscreenElement), true);
  assert.equal(await playerPage.locator("iframe").evaluate((frame) => frame.clientHeight), await playerPage.evaluate(() => document.fullscreenElement.clientHeight));
  await playerPage.screenshot({ path: path.join(screenshots, "game-fullscreen.png") });
  await playerPage.getByRole("button", { name: "退出全屏", exact: true }).click();
  await playerPage.waitForFunction(() => !document.fullscreenElement);
  console.log("PASS: built-in scene compatibility, player load failure/retry, fullscreen entry/exit and sizing");
  console.log(`Screenshots: ${screenshots}`);
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
  delete globalThis.__gameTest;
}
