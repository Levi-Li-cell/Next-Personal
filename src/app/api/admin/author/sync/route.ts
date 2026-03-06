import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  authorEducation,
  authorExperience,
  authorHonor,
  authorProfile,
  authorSkill,
} from "@/db/schema/author";
import { nanoid } from "nanoid";
import { DEFAULT_AUTHOR_PHOTOS } from "@/lib/author-defaults";

export async function POST() {
  try {
    await db.delete(authorSkill);
    await db.delete(authorExperience);
    await db.delete(authorEducation);
    await db.delete(authorHonor);
    await db.delete(authorProfile);

    const [profile] = await db
      .insert(authorProfile)
      .values({
        id: nanoid(),
        name: "李伟",
        title: "前端开发师",
        bio: "本人性格踏实稳重，严谨务实、有较强抗压能力；具备良好审美与代码习惯；热爱学习，擅长团队协作。",
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
      })
      .returning();

    await db.insert(authorHonor).values([
      { id: nanoid(), title: "HarmonyOS应用开发高级认证", issuer: "认证机构", date: "", description: "", imageUrl: "", sortOrder: "1" },
      { id: nanoid(), title: "经开杯创新创业大赛金奖", issuer: "经开杯", date: "", description: "", imageUrl: "", sortOrder: "2" },
      { id: nanoid(), title: "荣获二等奖学金", issuer: "学校", date: "", description: "", imageUrl: "", sortOrder: "3" },
      { id: nanoid(), title: "普通话二级乙等", issuer: "测试机构", date: "", description: "", imageUrl: "", sortOrder: "4" },
      { id: nanoid(), title: "C1类驾驶执照", issuer: "交管部门", date: "", description: "", imageUrl: "", sortOrder: "5" },
    ]);

    await db.insert(authorSkill).values([
      { id: nanoid(), name: "HTML/CSS/JavaScript/TypeScript", level: "95", category: "前端基础", sortOrder: "1" },
      { id: nanoid(), name: "Uni-app 多端开发", level: "92", category: "框架技术", sortOrder: "2" },
      { id: nanoid(), name: "微信小程序原生能力", level: "90", category: "小程序", sortOrder: "3" },
      { id: nanoid(), name: "Vue3 + ElementPlus/AntD", level: "93", category: "框架技术", sortOrder: "4" },
      { id: nanoid(), name: "React + Hooks", level: "80", category: "框架技术", sortOrder: "5" },
      { id: nanoid(), name: "虚拟列表/懒加载优化", level: "88", category: "性能优化", sortOrder: "6" },
      { id: nanoid(), name: "WebSocket 实时通信", level: "86", category: "通信", sortOrder: "7" },
      { id: nanoid(), name: "Git 团队协作", level: "90", category: "工程化", sortOrder: "8" },
      { id: nanoid(), name: "Node.js 后端联调", level: "78", category: "后端技能", sortOrder: "9" },
      { id: nanoid(), name: "Apifox/Swagger 接口测试", level: "85", category: "工程化", sortOrder: "10" },
      { id: nanoid(), name: "Ethers.js/Web3.js + 钱包集成", level: "88", category: "Web3", sortOrder: "11" },
      { id: nanoid(), name: "ArkTS 鸿蒙开发", level: "90", category: "鸿蒙开发", sortOrder: "12" },
      { id: nanoid(), name: "鸿蒙Kit能力实现", level: "88", category: "鸿蒙开发", sortOrder: "13" },
      { id: nanoid(), name: "鸿蒙端云一体化", level: "85", category: "鸿蒙开发", sortOrder: "14" },
    ]);

    await db.insert(authorExperience).values([
      {
        id: nanoid(),
        company: "江西幻云信息有限公司",
        position: "前端工程师",
        startDate: "2025.4",
        endDate: "2025.7",
        description: "项目：夜莺教学（Web3 去中心化教育资产管理平台）",
        achievements: [
          "Vue3 + Vite + TS + Element Plus 双端核心开发",
          "集成 DID 与钱包 SDK 实现无密码登录",
          "Web Worker + 分块哈希处理大文件",
          "IndexedDB + 离线缓存 + 多线程上传下载队列",
          "Pinia 状态管理 + i18n 国际化体系",
        ],
        techStack: ["Vue 3", "Element Plus", "Node.js", "MySQL", "Git", "Web3"],
        sortOrder: "1",
      },
      {
        id: nanoid(),
        company: "厦门零度象限有限公司",
        position: "前端工程师",
        startDate: "2025.8",
        endDate: "2025.12",
        description: "项目：幼师麦穗圈小程序",
        achievements: [
          "负责整体前端架构与核心模块开发",
          "完成资源详情页与富文本渲染、轮播等体验优化",
          "RESTful 接口联调与登录鉴权逻辑完善",
          "Pinia 全局状态管理与跨页面数据同步",
          "多端适配与兼容性优化",
          "后台管理系统（若依）前端开发与 RBAC 权限控制",
        ],
        techStack: ["Uniapp", "Vue3", "Axios", "Pinia", "Swagger", "Gemini API"],
        sortOrder: "2",
      },
      {
        id: nanoid(),
        company: "厦门零度象限有限公司",
        position: "前端工程师",
        startDate: "2025.8",
        endDate: "2025.12",
        description: "项目：OMG测评平台（公开网址：OMGREVIEW）",
        achievements: [
          "洋葱式架构、登录注册、消息通知、测评模板动态渲染",
          "Swagger 联调、异常处理、鉴权逻辑",
          "虚拟列表和懒加载优化大数据视频测评页面",
          "接口合并、渐进加载、资源压缩、云存储优化",
          "参与多端方案选型与目录结构制定",
        ],
        techStack: ["Uniapp", "Vue3", "Axios", "Pinia", "Swagger", "RESTful API"],
        sortOrder: "3",
      },
    ]);

    await db.insert(authorEducation).values([
      {
        id: nanoid(),
        school: "南昌交通学院",
        major: "智能科技",
        degree: "本科",
        startDate: "2021.9",
        endDate: "2025.6",
        description: "主修课程",
        achievements: [
          "HTML5 程序设计",
          "微信小程序开发",
          "基于HarmonyOs的移动智能终端应用开发",
          "C++语言程序设计",
          "Python语言程序设计",
          "数据结构",
          "MySQL数据库原理",
          "计算机组成原理",
          "嵌入式原理",
          "神经网络和深度学习",
        ],
        sortOrder: "1",
      },
    ]);

    return NextResponse.json({
      success: true,
      message: "作者信息已同步到数据库",
      data: { profileId: profile.id },
    });
  } catch (error) {
    console.error("同步作者信息失败:", error);
    return NextResponse.json(
      { success: false, error: "同步作者信息失败" },
      { status: 500 }
    );
  }
}
