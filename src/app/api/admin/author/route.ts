import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { authorProfile } from "@/db/schema/author";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { DEFAULT_AUTHOR_PHOTOS } from "@/lib/author-defaults";

// GET /api/admin/author - 获取作者信息
export async function GET() {
  try {
    const profiles = await db
      .select()
      .from(authorProfile)
      .orderBy(desc(authorProfile.createdAt))
      .limit(1);

    if (profiles.length === 0) {
      // 如果没有数据，返回默认值
      return NextResponse.json({
        success: true,
        data: {
          id: null,
          name: "李伟",
          title: "前端开发师",
          bio: "本人性格踏实稳重，严谨务实、有较强抗压能力；具备良好审美与代码习惯；对互联网行业有较强学习热情，擅长团队协作开发与沟通。",
          gender: "男",
          age: "24",
          phone: "13043428526",
          education: "本科",
          location: "江西 · 汉族",
          preferredCity: "全国",
          preferredPosition: "前端开发师",
          expectedSalary: "面议",
          githubUrl: "",
          linkedinUrl: "",
          email: "",
          hobbies: ["台球", "乒乓球", "羽毛球", "篮球", "骑行", "平面设计", "绘画"],
          photos: DEFAULT_AUTHOR_PHOTOS,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: profiles[0],
    });
  } catch (error) {
    console.error("获取作者信息失败:", error);
    return NextResponse.json(
      { success: false, error: "获取作者信息失败" },
      { status: 500 }
    );
  }
}

// POST /api/admin/author - 创建或更新作者信息
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 检查是否已存在
    const existing = await db.select().from(authorProfile).limit(1);

    if (existing.length > 0) {
      // 更新
      const [updated] = await db
        .update(authorProfile)
        .set({
          name: body.name,
          title: body.title,
          bio: body.bio,
          gender: body.gender,
          age: body.age,
          phone: body.phone,
          education: body.education,
          location: body.location,
          preferredCity: body.preferredCity,
          preferredPosition: body.preferredPosition,
          expectedSalary: body.expectedSalary,
          githubUrl: body.githubUrl,
          linkedinUrl: body.linkedinUrl,
          email: body.email,
          hobbies: body.hobbies,
          photos: body.photos,
          updatedAt: new Date(),
        })
        .where(eq(authorProfile.id, existing[0].id))
        .returning();

      return NextResponse.json({
        success: true,
        data: updated,
        message: "作者信息更新成功",
      });
    } else {
      // 创建
      const [created] = await db
        .insert(authorProfile)
        .values({
          id: nanoid(),
          name: body.name,
          title: body.title,
          bio: body.bio,
          gender: body.gender,
          age: body.age,
          phone: body.phone,
          education: body.education,
          location: body.location,
          preferredCity: body.preferredCity,
          preferredPosition: body.preferredPosition,
          expectedSalary: body.expectedSalary,
          githubUrl: body.githubUrl,
          linkedinUrl: body.linkedinUrl,
          email: body.email,
          hobbies: body.hobbies,
          photos: body.photos,
        })
        .returning();

      return NextResponse.json({
        success: true,
        data: created,
        message: "作者信息创建成功",
      });
    }
  } catch (error) {
    console.error("保存作者信息失败:", error);
    return NextResponse.json(
      { success: false, error: "保存作者信息失败" },
      { status: 500 }
    );
  }
}
