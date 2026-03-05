import { NextResponse } from "next/server";
import { db } from "@/db";
import { authorProfile, authorSkill, authorExperience, authorEducation, authorHonor } from "@/db/schema/author";
import { asc, desc } from "drizzle-orm";

// GET /api/author - 获取所有作者信息（公开API）
export async function GET() {
  const fallbackProfile = {
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
    photos: [],
  };

  try {
    // 并行获取所有数据
    const [profiles, skills, experiences, education, honors] = await Promise.all([
      db.select().from(authorProfile).orderBy(desc(authorProfile.createdAt)).limit(1),
      db.select().from(authorSkill).orderBy(asc(authorSkill.sortOrder)),
      db.select().from(authorExperience).orderBy(asc(authorExperience.sortOrder)),
      db.select().from(authorEducation).orderBy(asc(authorEducation.sortOrder)),
      db.select().from(authorHonor).orderBy(asc(authorHonor.sortOrder)),
    ]);

    const profile = profiles[0] || fallbackProfile;

    return NextResponse.json({
      success: true,
      data: {
        profile,
        skills,
        experiences,
        education,
        honors,
      },
    });
  } catch (error) {
    console.error("获取作者信息失败:", error);
    return NextResponse.json({
      success: true,
      data: {
        profile: fallbackProfile,
        skills: [],
        experiences: [],
        education: [],
        honors: [],
      },
      degraded: true,
    });
  }
}
