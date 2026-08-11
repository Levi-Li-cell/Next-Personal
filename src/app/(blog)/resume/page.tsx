"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download } from "lucide-react";

interface EvaluationItem {
  id: string;
  content: string;
  sortOrder: number;
}

interface AuthorData {
  profile: {
    name: string;
    title: string;
    bio: string;
    gender: string;
    age: string;
    phone: string;
    education: string;
    location: string;
    preferredCity: string;
    preferredPosition: string;
    expectedSalary: string;
    githubUrl?: string;
    linkedinUrl?: string;
    hobbies: string[];
  };
  skills: Array<{ id: string; name: string; level: string; category: string }>;
  experiences: Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
    achievements: string[];
    techStack: string[];
  }>;
  education: Array<{
    id: string;
    school: string;
    major: string;
    degree: string;
    startDate: string;
    endDate: string;
    description: string;
    achievements: string[];
  }>;
  honors: Array<{ id: string; title: string }>;
}

export default function ResumePage() {
  const [data, setData] = useState<AuthorData | null>(null);
  const [evaluations, setEvaluations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/author").then((r) => r.json()),
      fetch("/api/author/evaluation").then((r) => r.json()),
    ])
      .then(([authorRes, evalRes]) => {
        if (authorRes.success) setData(authorRes.data);
        if (evalRes.success && Array.isArray(evalRes.data)) {
          setEvaluations(evalRes.data.map((item: EvaluationItem) => item.content));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white/60">加载简历数据...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white/60">暂无简历数据</p>
      </div>
    );
  }

  const { profile } = data;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* 工具栏 - 打印时隐藏 */}
      <div className="no-print sticky top-0 z-50 bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        <h1 className="text-sm font-medium">简历预览（打印/PDF导出）</h1>
        <Button
          size="sm"
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Printer className="w-4 h-4 mr-2" />
          打印 / 导出PDF
        </Button>
      </div>

      {/* 简历内容 - A4 纸样式 */}
      <div className="mx-auto max-w-[210mm] bg-white shadow-lg p-8 print:shadow-none print:p-6 print:max-w-none">
        {/* 头部 */}
        <header className="border-b-2 border-gray-800 pb-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {profile.name}
              </h1>
              <p className="text-lg text-gray-600 mt-1">{profile.title}</p>
            </div>
            <div className="text-right text-sm text-gray-600 space-y-1">
              {profile.phone && <p>电话：{profile.phone}</p>}
              {profile.gender && <p>性别：{profile.gender}</p>}
              {profile.age && <p>年龄：{profile.age}</p>}
              {profile.location && <p>现居：{profile.location}</p>}
              {profile.githubUrl && (
                <p>
                  GitHub：
                  <a
                    href={profile.githubUrl}
                    className="text-blue-600 hover:underline"
                  >
                    {profile.githubUrl}
                  </a>
                </p>
              )}
              {profile.linkedinUrl && (
                <p>
                  LinkedIn：
                  <a
                    href={profile.linkedinUrl}
                    className="text-blue-600 hover:underline"
                  >
                    {profile.linkedinUrl}
                  </a>
                </p>
              )}
            </div>
          </div>
        </header>

        {/* 求职意向 */}
        {(profile.preferredCity ||
          profile.preferredPosition ||
          profile.expectedSalary) && (
          <section className="mb-6">
            <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3">
              求职意向
            </h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              {profile.preferredPosition && (
                <div>
                  <span className="text-gray-500">期望职位：</span>
                  <span className="font-medium">{profile.preferredPosition}</span>
                </div>
              )}
              {profile.preferredCity && (
                <div>
                  <span className="text-gray-500">期望城市：</span>
                  <span className="font-medium">{profile.preferredCity}</span>
                </div>
              )}
              {profile.expectedSalary && (
                <div>
                  <span className="text-gray-500">期望薪资：</span>
                  <span className="font-medium">{profile.expectedSalary}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 个人简介 */}
        {profile.bio && (
          <section className="mb-6">
            <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3">
              个人简介
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
          </section>
        )}

        {/* 技能 */}
        {data.skills && data.skills.length > 0 && (
          <section className="mb-6">
            <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3">
              技能清单
            </h2>
            {Object.entries(
              data.skills.reduce<Record<string, string[]>>((acc, skill) => {
                if (!acc[skill.category]) acc[skill.category] = [];
                acc[skill.category].push(skill.name);
                return acc;
              }, {})
            ).map(([category, items]) => (
              <div key={category} className="mb-2">
                <span className="text-sm font-medium text-gray-600">
                  {category}：
                </span>
                <span className="text-sm text-gray-700">
                  {items.join("、")}
                </span>
              </div>
            ))}
          </section>
        )}

        {/* 工作经历 */}
        {data.experiences && data.experiences.length > 0 && (
          <section className="mb-6">
            <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3">
              工作经历
            </h2>
            <div className="space-y-4">
              {data.experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-gray-800">
                      {exp.company} — {exp.position}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {exp.startDate} ~ {exp.endDate}
                    </span>
                  </div>
                  {exp.description && (
                    <p className="text-sm text-gray-700 mb-1">
                      {exp.description}
                    </p>
                  )}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <ul className="list-disc list-inside text-sm text-gray-600 ml-2 space-y-0.5">
                      {exp.achievements.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {exp.techStack && exp.techStack.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      技术栈：{exp.techStack.join("、")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 教育背景 */}
        {data.education && data.education.length > 0 && (
          <section className="mb-6">
            <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3">
              教育背景
            </h2>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-gray-800">
                      {edu.school} — {edu.major}（{edu.degree}）
                    </h3>
                    <span className="text-xs text-gray-500">
                      {edu.startDate} ~ {edu.endDate}
                    </span>
                  </div>
                  {edu.description && (
                    <p className="text-sm text-gray-700">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 荣誉证书 */}
        {data.honors && data.honors.length > 0 && (
          <section className="mb-6">
            <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3">
              荣誉证书
            </h2>
            <ul className="list-disc list-inside text-sm text-gray-600 ml-2 space-y-0.5">
              {data.honors.map((honor) => (
                <li key={honor.id}>{honor.title}</li>
              ))}
            </ul>
          </section>
        )}

        {/* 自我评价 */}
        {evaluations.length > 0 && (
          <section className="mb-6">
            <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3">
              自我评价
            </h2>
            <ul className="list-disc list-inside text-sm text-gray-600 ml-2 space-y-0.5">
              {evaluations.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
