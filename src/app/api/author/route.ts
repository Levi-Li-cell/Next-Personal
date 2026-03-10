import { NextResponse } from "next/server";
import { db } from "@/db";
import { authorProfile, authorSkill, authorExperience, authorEducation, authorHonor } from "@/db/schema/author";
import { asc, desc } from "drizzle-orm";
import { DEFAULT_AUTHOR_PHOTOS } from "@/lib/author-defaults";

// GET /api/author - 获取所有作者信息（公开API）
export async function GET() {
  const fallbackProfile = {
    name: "李伟",
    title: "全栈工程师",
    bio: "本人性格踏实稳重，严谨务实、有较强抗压能力；具备良好的审美能力和编码习惯；对互联网行业有较强学习热情与自学能力，擅长团队协作开发与沟通交流。",
    gender: "男",
    age: "24",
    phone: "13043428526",
    education: "本科",
    location: "江西 · 汉族",
    preferredCity: "全国",
    preferredPosition: "全栈工程师",
    expectedSalary: "面议",
    githubUrl: "",
    linkedinUrl: "",
    email: "",
    hobbies: ["台球", "乒乓球", "羽毛球", "篮球", "骑行", "平面设计", "绘画"],
    photos: DEFAULT_AUTHOR_PHOTOS,
  };

  const fallbackSkills = [
    { id: "s1", name: "HTML/CSS/JavaScript/TypeScript", level: "95", category: "前端基础", sortOrder: "1" },
    { id: "s2", name: "Uni-app 多端开发（Web/安卓/iOS）", level: "92", category: "跨端开发", sortOrder: "2" },
    { id: "s3", name: "微信小程序原生能力（云开发/音视频/相机）", level: "90", category: "小程序", sortOrder: "3" },
    { id: "s4", name: "Vue3 + Element Plus / Ant Design", level: "93", category: "框架技术", sortOrder: "4" },
    { id: "s5", name: "React + Hooks", level: "80", category: "框架技术", sortOrder: "5" },
    { id: "s6", name: "虚拟列表/预加载/懒加载性能优化", level: "88", category: "性能优化", sortOrder: "6" },
    { id: "s7", name: "WebSocket 即时通讯与消息推送", level: "86", category: "通信", sortOrder: "7" },
    { id: "s8", name: "Git 团队协作与持续集成", level: "90", category: "工程化", sortOrder: "8" },
    { id: "s9", name: "Node.js 后端模拟与联调", level: "78", category: "后端能力", sortOrder: "9" },
    { id: "s10", name: "Apifox / Swagger 接口测试", level: "85", category: "测试联调", sortOrder: "10" },
    { id: "s11", name: "Ethers.js/Web3.js + 钱包集成 + DID", level: "88", category: "Web3", sortOrder: "11" },
    { id: "s12", name: "ArkTS 鸿蒙原生开发", level: "90", category: "鸿蒙开发", sortOrder: "12" },
    { id: "s13", name: "鸿蒙 Kit 能力实现", level: "88", category: "鸿蒙开发", sortOrder: "13" },
    { id: "s14", name: "鸿蒙端云一体化开发", level: "85", category: "鸿蒙开发", sortOrder: "14" },
  ];

  const fallbackExperiences = [
    {
      id: "e1",
      company: "江西幻云信息有限公司",
      position: "前端工程师",
      startDate: "2025.4",
      endDate: "2025.7",
      description: "项目：夜莺教学（Web3 去中心化教育资产管理平台）",
      achievements: [
        "使用 Vue3 + Vite + TypeScript + Element Plus 完成教师端与学生端核心业务开发，并基于 Node.js + Express 设计 RESTful API",
        "深度集成夜莺生态 Web3 钱包 SDK，结合 DID 与区块地址实现去中心化无密码登录和多角色动态权限控制",
        "利用 Web Worker 加载底层分块哈希加密算法处理大文件数据",
        "引入 IndexedDB + 本地离线缓存 + 多线程异步上传下载队列，优化链上弱网体验",
        "使用 Pinia 统一管理应用状态，并搭建 i18n 多语言框架",
      ],
      techStack: ["Vue 3", "Element Plus", "ECharts", "Node.js", "MySQL", "Git", "Web3"],
      sortOrder: "1",
    },
    {
      id: "e2",
      company: "厦门零度象限有限公司",
      position: "前端工程师",
      startDate: "2025.8",
      endDate: "2025.12",
      description: "项目：幼师麦穗圈小程序",
      achievements: [
        "负责首页信息流、资源分类筛选、登录授权、积分成长、评论互动与公共请求封装模块开发",
        "完成资源详情页动态渲染与富文本处理，结合 Swiper 实现轮播与活动 banner，优化首屏性能",
        "基于 RESTful API 与后端联调，使用 Swagger 调试与参数校验，完善异常与鉴权逻辑",
        "基于 Pinia 完成用户信息缓存、权限控制、收藏状态同步等全局状态管理",
        "完成 PC/iOS Web/Android Web 多端适配与兼容性优化",
        "参与后台管理系统前端开发与 RBAC 权限控制，实现用户管理、内容审核、数据统计等模块",
      ],
      techStack: ["Uniapp", "Vue3", "Swiper", "Axios", "Pinia", "Swagger", "Gemini API"],
      sortOrder: "2",
    },
    {
      id: "e3",
      company: "厦门零度象限有限公司",
      position: "前端工程师",
      startDate: "2025.8",
      endDate: "2025.12",
      description: "项目：OMG测评平台（公开网址：OMGREVIEW）",
      achievements: [
        "负责洋葱式架构、首页框架、登录注册、消息通知、测评模板动态渲染与公共请求模块",
        "负责 Swagger 接口测试、异常处理与鉴权逻辑，保障前后端交互稳定",
        "使用虚拟列表与懒加载处理视频测评大数据渲染场景",
        "完成接口合并、渐进式加载、组件懒加载、资源压缩与云存储优化",
        "参与技术选型与多端方案评估，制定项目目录结构并推进落地",
      ],
      techStack: ["Uniapp", "Vue3", "Swiper", "Axios", "Pinia", "Swagger", "RESTful API"],
      sortOrder: "3",
    },
  ];

  const fallbackEducation = [
    {
      id: "ed1",
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
  ];

  const fallbackHonors = [
    { id: "h1", title: "HarmoneyOS应用开发高级认证", issuer: "认证机构", date: "", description: "", imageUrl: "", sortOrder: "1" },
    { id: "h2", title: "经开杯创新创业大赛金奖", issuer: "经开杯", date: "", description: "", imageUrl: "", sortOrder: "2" },
    { id: "h3", title: "荣获二等奖学金", issuer: "学校", date: "", description: "", imageUrl: "", sortOrder: "3" },
    { id: "h4", title: "普通话二级乙等", issuer: "测试机构", date: "", description: "", imageUrl: "", sortOrder: "4" },
    { id: "h5", title: "C1类驾驶执照", issuer: "交管部门", date: "", description: "", imageUrl: "", sortOrder: "5" },
  ];

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
        skills: fallbackSkills,
        experiences: fallbackExperiences,
        education: fallbackEducation,
        honors: fallbackHonors,
      },
      degraded: true,
    });
  }
}
