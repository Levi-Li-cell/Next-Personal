"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Save, Plus, Trash2, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AuthorProfile {
  id: string | null;
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
  githubUrl: string;
  linkedinUrl: string;
  email: string;
  hobbies: string[];
  photos: string[];
}

interface Skill {
  id: string;
  name: string;
  level: string;
  category: string;
}

interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  achievements: string[];
  techStack: string[];
}

interface Education {
  id: string;
  school: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
  description: string;
  achievements: string[];
}

interface Honor {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
  imageUrl: string;
}

export default function AuthorManagePage() {
  const [profile, setProfile] = useState<AuthorProfile>({
    id: null,
    name: "李伟",
    title: "前端开发工程师",
    bio: "",
    gender: "男",
    age: "23岁",
    phone: "13043428526",
    education: "本科",
    location: "江西 · 汉族",
    preferredCity: "全国",
    preferredPosition: "前端开发工程师",
    expectedSalary: "面议",
    githubUrl: "",
    linkedinUrl: "",
    email: "",
    hobbies: [],
    photos: [],
  });
  const [skills, setSkills] = useState<Skill[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [honors, setHonors] = useState<Honor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newHobby, setNewHobby] = useState("");

  // 加载数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileRes, skillsRes, expRes, eduRes, honorsRes] = await Promise.all([
          fetch("/api/admin/author"),
          fetch("/api/admin/author/skills"),
          fetch("/api/admin/author/experiences"),
          fetch("/api/admin/author/education"),
          fetch("/api/admin/author/honors"),
        ]);

        const profileData = await profileRes.json();
        const skillsData = await skillsRes.json();
        const expData = await expRes.json();
        const eduData = await eduRes.json();
        const honorsData = await honorsRes.json();

        if (profileData.success) {
          setProfile(profileData.data);
        }
        if (skillsData.success) {
          setSkills(skillsData.data);
        }
        if (expData.success) {
          setExperiences(expData.data);
        }
        if (eduData.success) {
          setEducation(eduData.data);
        }
        if (honorsData.success) {
          setHonors(honorsData.data);
        }
      } catch (error) {
        console.error("加载数据失败:", error);
        toast.error("加载数据失败");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 保存基本信息
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/admin/author", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        setProfile(data.data);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error("保存失败:", error);
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  // 添加爱好
  const handleAddHobby = () => {
    if (newHobby.trim()) {
      setProfile({ ...profile, hobbies: [...profile.hobbies, newHobby.trim()] });
      setNewHobby("");
    }
  };

  // 删除爱好
  const handleRemoveHobby = (index: number) => {
    setProfile({
      ...profile,
      hobbies: profile.hobbies.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">作者管理</h1>
          <p className="text-muted-foreground">管理个人简介、技能、经历等信息</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">基本信息</TabsTrigger>
          <TabsTrigger value="skills">技能特长</TabsTrigger>
          <TabsTrigger value="experience">工作经历</TabsTrigger>
          <TabsTrigger value="education">教育经历</TabsTrigger>
          <TabsTrigger value="honors">荣誉证书</TabsTrigger>
        </TabsList>

        {/* 基本信息 */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>编辑您的个人基本信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">姓名</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">职位</Label>
                  <Input
                    id="title"
                    value={profile.title}
                    onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">性别</Label>
                  <Input
                    id="gender"
                    value={profile.gender}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">年龄</Label>
                  <Input
                    id="age"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">联系电话</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education">学历</Label>
                  <Input
                    id="education"
                    value={profile.education}
                    onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">户籍</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferredCity">意向城市</Label>
                  <Input
                    id="preferredCity"
                    value={profile.preferredCity}
                    onChange={(e) => setProfile({ ...profile, preferredCity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferredPosition">意向岗位</Label>
                  <Input
                    id="preferredPosition"
                    value={profile.preferredPosition}
                    onChange={(e) => setProfile({ ...profile, preferredPosition: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedSalary">期望薪资</Label>
                  <Input
                    id="expectedSalary"
                    value={profile.expectedSalary}
                    onChange={(e) => setProfile({ ...profile, expectedSalary: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="githubUrl">GitHub</Label>
                  <Input
                    id="githubUrl"
                    value={profile.githubUrl}
                    onChange={(e) => setProfile({ ...profile, githubUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedinUrl">LinkedIn</Label>
                  <Input
                    id="linkedinUrl"
                    value={profile.linkedinUrl}
                    onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">个人简介</Label>
                <Textarea
                  id="bio"
                  rows={4}
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                />
              </div>

              {/* 兴趣爱好 */}
              <div className="space-y-2">
                <Label>兴趣爱好</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="添加爱好"
                    value={newHobby}
                    onChange={(e) => setNewHobby(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddHobby()}
                  />
                  <Button onClick={handleAddHobby} type="button">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.hobbies.map((hobby, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 px-3 py-1 bg-secondary rounded-full text-sm"
                    >
                      {hobby}
                      <button
                        onClick={() => handleRemoveHobby(index)}
                        className="ml-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                保存信息
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 技能特长 */}
        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>技能特长</CardTitle>
              <CardDescription>管理您的专业技能</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skills.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{skill.name}</p>
                      <p className="text-sm text-muted-foreground">熟练度: {skill.level}%</p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {skills.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">暂无技能数据</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 工作经历 */}
        <TabsContent value="experience">
          <Card>
            <CardHeader>
              <CardTitle>工作经历</CardTitle>
              <CardDescription>管理您的工作经历</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {experiences.map((exp) => (
                  <div key={exp.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{exp.company}</p>
                        <p className="text-sm text-muted-foreground">{exp.position}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {exp.startDate} - {exp.endDate || "至今"}
                      </p>
                    </div>
                    {exp.description && <p className="text-sm">{exp.description}</p>}
                  </div>
                ))}
                {experiences.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">暂无工作经历</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 教育经历 */}
        <TabsContent value="education">
          <Card>
            <CardHeader>
              <CardTitle>教育经历</CardTitle>
              <CardDescription>管理您的教育背景</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {education.map((edu) => (
                  <div key={edu.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{edu.school}</p>
                        <p className="text-sm text-muted-foreground">{edu.major} · {edu.degree}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {edu.startDate} - {edu.endDate}
                      </p>
                    </div>
                    {edu.description && <p className="text-sm">{edu.description}</p>}
                  </div>
                ))}
                {education.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">暂无教育经历</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 荣誉证书 */}
        <TabsContent value="honors">
          <Card>
            <CardHeader>
              <CardTitle>荣誉证书</CardTitle>
              <CardDescription>管理您的荣誉和证书</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {honors.map((honor) => (
                  <div key={honor.id} className="p-4 border rounded-lg">
                    <p className="font-medium mb-1">{honor.title}</p>
                    {honor.issuer && <p className="text-sm text-muted-foreground">{honor.issuer}</p>}
                    {honor.date && <p className="text-xs text-muted-foreground mt-1">{honor.date}</p>}
                  </div>
                ))}
                {honors.length === 0 && (
                  <div className="col-span-full text-center text-muted-foreground py-8">
                    暂无荣誉证书
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
