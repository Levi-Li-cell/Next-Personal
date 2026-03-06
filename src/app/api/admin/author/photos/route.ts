import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { authorProfile } from "@/db/schema/author";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { DEFAULT_AUTHOR_PHOTOS } from "@/lib/author-defaults";

async function getLatestProfile() {
  const rows = await db
    .select()
    .from(authorProfile)
    .orderBy(desc(authorProfile.createdAt))
    .limit(1);

  return rows[0] || null;
}

async function ensureProfile() {
  const profile = await getLatestProfile();
  if (profile) return profile;

  const [created] = await db
    .insert(authorProfile)
    .values({
      id: nanoid(),
      name: "李伟",
      title: "前端开发师",
      photos: DEFAULT_AUTHOR_PHOTOS,
    })
    .returning();

  return created;
}

export async function GET() {
  try {
    const profile = await getLatestProfile();
    const photos = Array.isArray(profile?.photos) ? profile.photos : [];

    if (!profile || photos.length === 0) {
      const ensured = await ensureProfile();
      const ensuredPhotos = Array.isArray(ensured.photos) ? ensured.photos : [];
      if (ensuredPhotos.length > 0) {
        return NextResponse.json({ success: true, data: ensuredPhotos });
      }

      const [updated] = await db
        .update(authorProfile)
        .set({ photos: DEFAULT_AUTHOR_PHOTOS, updatedAt: new Date() })
        .where(eq(authorProfile.id, ensured.id))
        .returning();

      return NextResponse.json({ success: true, data: updated?.photos || DEFAULT_AUTHOR_PHOTOS });
    }

    return NextResponse.json({
      success: true,
      data: photos,
    });
  } catch (error) {
    console.error("获取作者图片失败:", error);
    return NextResponse.json({ success: false, error: "获取作者图片失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = String(body.url || "").trim();

    if (!url) {
      return NextResponse.json({ success: false, error: "图片URL不能为空" }, { status: 400 });
    }

    const profile = await ensureProfile();
    const photos = Array.isArray(profile.photos) ? profile.photos : [];
    const nextPhotos = photos.includes(url) ? photos : [...photos, url];

    const [updated] = await db
      .update(authorProfile)
      .set({
        photos: nextPhotos,
        updatedAt: new Date(),
      })
      .where(eq(authorProfile.id, profile.id))
      .returning();

    return NextResponse.json({ success: true, data: updated.photos || [] });
  } catch (error) {
    console.error("新增作者图片失败:", error);
    return NextResponse.json({ success: false, error: "新增作者图片失败" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const index = Number(body.index);
    const url = String(body.url || "").trim();

    if (Number.isNaN(index) || index < 0) {
      return NextResponse.json({ success: false, error: "图片索引无效" }, { status: 400 });
    }
    if (!url) {
      return NextResponse.json({ success: false, error: "图片URL不能为空" }, { status: 400 });
    }

    const profile = await ensureProfile();
    const photos = Array.isArray(profile.photos) ? [...profile.photos] : [];

    if (index >= photos.length) {
      return NextResponse.json({ success: false, error: "图片索引超出范围" }, { status: 400 });
    }

    photos[index] = url;

    const [updated] = await db
      .update(authorProfile)
      .set({
        photos,
        updatedAt: new Date(),
      })
      .where(eq(authorProfile.id, profile.id))
      .returning();

    return NextResponse.json({ success: true, data: updated.photos || [] });
  } catch (error) {
    console.error("更新作者图片失败:", error);
    return NextResponse.json({ success: false, error: "更新作者图片失败" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const index = Number(body.index);

    if (Number.isNaN(index) || index < 0) {
      return NextResponse.json({ success: false, error: "图片索引无效" }, { status: 400 });
    }

    const profile = await ensureProfile();
    const photos = Array.isArray(profile.photos) ? [...profile.photos] : [];

    if (index >= photos.length) {
      return NextResponse.json({ success: false, error: "图片索引超出范围" }, { status: 400 });
    }

    photos.splice(index, 1);

    const [updated] = await db
      .update(authorProfile)
      .set({
        photos,
        updatedAt: new Date(),
      })
      .where(eq(authorProfile.id, profile.id))
      .returning();

    return NextResponse.json({ success: true, data: updated.photos || [] });
  } catch (error) {
    console.error("删除作者图片失败:", error);
    return NextResponse.json({ success: false, error: "删除作者图片失败" }, { status: 500 });
  }
}
