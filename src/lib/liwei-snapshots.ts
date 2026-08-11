import { promises as fs } from "fs";
import path from "path";
import { LIWEI_PUBLIC_DIR } from "@/lib/liwei-fs";

export type RollbackSnap = {
  id: string;
  time: string;
  label: string;
  stickerCount: number;
  baked: boolean;
  hasGlb: boolean;
};

const SNAP_DIR = path.join(LIWEI_PUBLIC_DIR, "snapshots");
const MANIFEST_PATH = path.join(SNAP_DIR, "manifest.json");
const STICKERS_PATH = path.join(LIWEI_PUBLIC_DIR, "stickers.json");

async function readManifest(): Promise<RollbackSnap[]> {
  try {
    const raw = await fs.readFile(MANIFEST_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeManifest(snaps: RollbackSnap[]) {
  await fs.mkdir(SNAP_DIR, { recursive: true });
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(snaps, null, 2), "utf-8");
}

export async function listSnapshots(): Promise<RollbackSnap[]> {
  return readManifest();
}

export async function createSnapshot(label: string): Promise<RollbackSnap> {
  const manifest = await readManifest();
  const id = `snap-${Date.now()}`;
  await fs.mkdir(SNAP_DIR, { recursive: true });
  let stickerCount = 0;
  try {
    const stickers = await fs.readFile(STICKERS_PATH, "utf-8");
    await fs.writeFile(path.join(SNAP_DIR, `${id}.json`), stickers, "utf-8");
    const parsed = JSON.parse(stickers);
    stickerCount = parsed && typeof parsed === "object" ? Object.keys(parsed).length : 0;
  } catch {
    await fs.writeFile(path.join(SNAP_DIR, `${id}.json`), "{}", "utf-8");
  }
  const snap: RollbackSnap = {
    id,
    time: new Date().toISOString(),
    label,
    stickerCount,
    baked: false,
    hasGlb: false,
  };
  manifest.push(snap);
  await writeManifest(manifest);
  return snap;
}

export async function restoreSnapshot(id: string): Promise<void> {
  const snapPath = path.join(SNAP_DIR, `${id}.json`);
  const raw = await fs.readFile(snapPath, "utf-8");
  await fs.mkdir(path.dirname(STICKERS_PATH), { recursive: true });
  await fs.writeFile(STICKERS_PATH, raw, "utf-8");
}

export async function restoreClean(): Promise<void> {
  await createSnapshot("清理前快照");
  await fs.mkdir(path.dirname(STICKERS_PATH), { recursive: true });
  await fs.writeFile(STICKERS_PATH, "{}", "utf-8");
}
