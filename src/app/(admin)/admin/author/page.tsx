"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Save, Plus, Trash2, Edit, Upload, ImagePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  sortOrder?: string;
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
  sortOrder?: string;
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
  sortOrder?: string;
}

interface Honor {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
  imageUrl: string;
  sortOrder?: string;
}

type DeleteTarget = {
  type: "skills" | "experiences" | "education" | "honors";
  id: string;
  label: string;
};

export default function AuthorManagePage() {
  const [profile, setProfile] = useState<AuthorProfile>({
    id: null,
    name: "李伟",
    title: "全栈工程师",
    bio: "本人性格踏实稳重，严谨务实，有较强抗压能力；具备良好审美与代码习惯；对互联网行业有较强学习热情与自学能力；擅于团队协作与沟通交流。",
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [experienceDialogOpen, setExperienceDialogOpen] = useState(false);
  const [educationDialogOpen, setEducationDialogOpen] = useState(false);
  const [honorDialogOpen, setHonorDialogOpen] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);
  const [editingEducationId, setEditingEducationId] = useState<string | null>(null);
  const [editingHonorId, setEditingHonorId] = useState<string | null>(null);
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');

  const [skillForm, setSkillForm] = useState({
    name: "",
    level: "80",
    category: "前端基础",
    sortOrder: "",
  });

  const [experienceForm, setExperienceForm] = useState({
    company: "",
    position: "前端工程师",
    startDate: "",
    endDate: "",
    description: "",
    achievementsText: "",
    techStackText: "",
    sortOrder: "",
  });

  const [educationForm, setEducationForm] = useState({
    school: "",
    major: "",
    degree: "本科",
    startDate: "",
    endDate: "",
    description: "",
    achievementsText: "",
    sortOrder: "",
  });

  const [honorForm, setHonorForm] = useState({
    title: "",
    issuer: "",
    date: "",
    description: "",
    imageUrl: "",
    sortOrder: "",
  });

  const [photoFormUrl, setPhotoFormUrl] = useState("");

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

  useEffect(() => {
    fetchData();
  }, []);

  const handleSyncResumeTemplate = async () => {
    try {
      const response = await fetch("/api/admin/author/sync", { method: "POST" });
      const data = await response.json();
      if (!data.success) {
        toast.error(data.error || "同步失败");
        return;
      }
      toast.success("已按简历模板同步作者数据");
      fetchData();
    } catch (error) {
      console.error("同步简历模板失败:", error);
      toast.error("同步失败");
    }
  };

  const parseCommaList = (value: string) =>
    value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

  const openCreateSkillDialog = () => {
    setEditingSkillId(null);
    setSkillForm({ name: "", level: "80", category: "前端基础", sortOrder: String(skills.length + 1) });
    setSkillDialogOpen(true);
  };

  const openEditSkillDialog = (item: Skill) => {
    setEditingSkillId(item.id);
    setSkillForm({
      name: item.name,
      level: item.level,
      category: item.category,
      sortOrder: item.sortOrder || "",
    });
    setSkillDialogOpen(true);
  };

  const submitSkillForm = async () => {
    if (!skillForm.name.trim()) {
      toast.error("请填写技能名称");
      return;
    }

    const levelNumber = Number(skillForm.level);
    if (Number.isNaN(levelNumber) || levelNumber < 0 || levelNumber > 100) {
      toast.error("熟练度必须是 0-100 的数字");
      return;
    }

    try {
      setFormSubmitting(true);
      const isEdit = Boolean(editingSkillId);
      const response = await fetch(
        isEdit ? `/api/admin/author/skills/${editingSkillId}` : "/api/admin/author/skills",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: skillForm.name.trim(),
            level: String(levelNumber),
            category: skillForm.category.trim() || "前端基础",
            sortOrder: skillForm.sortOrder.trim() || "0",
          }),
        }
      );

      const data = await response.json();
      if (!data.success) {
        toast.error(data.error || "保存技能失败");
        return;
      }

      toast.success(isEdit ? "技能已更新" : "技能已新增");
      setSkillDialogOpen(false);
      fetchData();
    } finally {
      setFormSubmitting(false);
    }
  };

  const openCreateExperienceDialog = () => {
    setEditingExperienceId(null);
    setExperienceForm({
      company: "",
      position: "前端工程师",
      startDate: "",
      endDate: "",
      description: "",
      achievementsText: "",
      techStackText: "",
      sortOrder: String(experiences.length + 1),
    });
    setExperienceDialogOpen(true);
  };

  const openEditExperienceDialog = (item: Experience) => {
    setEditingExperienceId(item.id);
    setExperienceForm({
      company: item.company,
      position: item.position,
      startDate: item.startDate,
      endDate: item.endDate || "",
      description: item.description || "",
      achievementsText: (item.achievements || []).join(", "),
      techStackText: (item.techStack || []).join(", "),
      sortOrder: item.sortOrder || "",
    });
    setExperienceDialogOpen(true);
  };

  const submitExperienceForm = async () => {
    if (!experienceForm.company.trim()) {
      toast.error("请填写公司名称");
      return;
    }
    if (!experienceForm.position.trim()) {
      toast.error("请填写职位");
      return;
    }
    if (!experienceForm.startDate.trim()) {
      toast.error("请填写开始时间");
      return;
    }

    try {
      setFormSubmitting(true);
      const isEdit = Boolean(editingExperienceId);
      const response = await fetch(
        isEdit ? `/api/admin/author/experiences/${editingExperienceId}` : "/api/admin/author/experiences",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company: experienceForm.company.trim(),
            position: experienceForm.position.trim(),
            startDate: experienceForm.startDate.trim(),
            endDate: experienceForm.endDate.trim(),
            description: experienceForm.description.trim(),
            achievements: parseCommaList(experienceForm.achievementsText),
            techStack: parseCommaList(experienceForm.techStackText),
            sortOrder: experienceForm.sortOrder.trim() || "0",
          }),
        }
      );

      const data = await response.json();
      if (!data.success) {
        toast.error(data.error || "保存工作经历失败");
        return;
      }

      toast.success(isEdit ? "工作经历已更新" : "工作经历已新增");
      setExperienceDialogOpen(false);
      fetchData();
    } finally {
      setFormSubmitting(false);
    }
  };

  const openCreateEducationDialog = () => {
    setEditingEducationId(null);
    setEducationForm({
      school: "",
      major: "",
      degree: "本科",
      startDate: "",
      endDate: "",
      description: "",
      achievementsText: "",
      sortOrder: String(education.length + 1),
    });
    setEducationDialogOpen(true);
  };

  const openEditEducationDialog = (item: Education) => {
    setEditingEducationId(item.id);
    setEducationForm({
      school: item.school,
      major: item.major,
      degree: item.degree,
      startDate: item.startDate,
      endDate: item.endDate,
      description: item.description || "",
      achievementsText: (item.achievements || []).join(", "),
      sortOrder: item.sortOrder || "",
    });
    setEducationDialogOpen(true);
  };

  const submitEducationForm = async () => {
    if (!educationForm.school.trim()) {
      toast.error("请填写学校名称");
      return;
    }
    if (!educationForm.major.trim()) {
      toast.error("请填写专业");
      return;
    }
    if (!educationForm.startDate.trim()) {
      toast.error("请填写开始时间");
      return;
    }
    if (!educationForm.endDate.trim()) {
      toast.error("请填写结束时间");
      return;
    }

    try {
      setFormSubmitting(true);
      const isEdit = Boolean(editingEducationId);
      const response = await fetch(
        isEdit ? `/api/admin/author/education/${editingEducationId}` : "/api/admin/author/education",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            school: educationForm.school.trim(),
            major: educationForm.major.trim(),
            degree: educationForm.degree.trim() || "本科",
            startDate: educationForm.startDate.trim(),
            endDate: educationForm.endDate.trim(),
            description: educationForm.description.trim(),
            achievements: parseCommaList(educationForm.achievementsText),
            sortOrder: educationForm.sortOrder.trim() || "0",
          }),
        }
      );

      const data = await response.json();
      if (!data.success) {
        toast.error(data.error || "保存教育经历失败");
        return;
      }

      toast.success(isEdit ? "教育经历已更新" : "教育经历已新增");
      setEducationDialogOpen(false);
      fetchData();
    } finally {
      setFormSubmitting(false);
    }
  };

  const openCreateHonorDialog = () => {
    setEditingHonorId(null);
    setHonorForm({
      title: "",
      issuer: "",
      date: "",
      description: "",
      imageUrl: "",
      sortOrder: String(honors.length + 1),
    });
    setHonorDialogOpen(true);
  };

  const openEditHonorDialog = (item: Honor) => {
    setEditingHonorId(item.id);
    setHonorForm({
      title: item.title,
      issuer: item.issuer || "",
      date: item.date || "",
      description: item.description || "",
      imageUrl: item.imageUrl || "",
      sortOrder: item.sortOrder || "",
    });
    setHonorDialogOpen(true);
  };

  const submitHonorForm = async () => {
    if (!honorForm.title.trim()) {
      toast.error("请填写荣誉名称");
      return;
    }

    try {
      setFormSubmitting(true);
      const isEdit = Boolean(editingHonorId);
      const response = await fetch(
        isEdit ? `/api/admin/author/honors/${editingHonorId}` : "/api/admin/author/honors",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: honorForm.title.trim(),
            issuer: honorForm.issuer.trim(),
            date: honorForm.date.trim(),
            description: honorForm.description.trim(),
            imageUrl: honorForm.imageUrl.trim(),
            sortOrder: honorForm.sortOrder.trim() || "0",
          }),
        }
      );

      const data = await response.json();
      if (!data.success) {
        toast.error(data.error || "保存荣誉失败");
        return;
      }

      toast.success(isEdit ? "荣誉已更新" : "荣誉已新增");
      setHonorDialogOpen(false);
      fetchData();
    } finally {
      setFormSubmitting(false);
    }
  };

  const requestDelete = (target: DeleteTarget) => {
    setDeleteTarget(target);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    const pathMap: Record<DeleteTarget["type"], string> = {
      skills: "skills",
      experiences: "experiences",
      education: "education",
      honors: "honors",
    };

    const textMap: Record<DeleteTarget["type"], string> = {
      skills: "技能",
      experiences: "工作经历",
      education: "教育经历",
      honors: "荣誉",
    };

    try {
      setFormSubmitting(true);
      const response = await fetch(`/api/admin/author/${pathMap[deleteTarget.type]}/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!data.success) {
        toast.error(data.error || `删除${textMap[deleteTarget.type]}失败`);
        return;
      }
      toast.success(`${textMap[deleteTarget.type]}已删除`);
      setDeleteTarget(null);
      fetchData();
    } finally {
      setFormSubmitting(false);
    }
  };

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

  const syncPhotosToServer = async (nextPhotos: string[]) => {
    const response = await fetch("/api/admin/author", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...profile, photos: nextPhotos }),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "作者图片同步失败");
    }
    setProfile(data.data);
  };

  const addPhotoWithApi = async (urlInput: string) => {
    const url = urlInput.trim();
    if (!url) return;
    try {
      const response = await fetch("/api/admin/author/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (!data.success) {
        toast.error(data.error || "新增图片失败");
        return;
      }
      const nextPhotos = data.data || [];
      await syncPhotosToServer(nextPhotos);
      toast.success("图片已新增");
    } catch (error) {
      console.error("新增图片失败:", error);
      toast.error("新增图片失败");
    }
  };

  const updatePhotoWithApi = async (index: number, value: string) => {
    try {
      const response = await fetch("/api/admin/author/photos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index, url: value.trim() }),
      });
      const data = await response.json();
      if (!data.success) {
        toast.error(data.error || "更新图片失败");
        return;
      }
      await syncPhotosToServer(data.data || []);
      toast.success("图片已更新");
    } catch (error) {
      console.error("更新图片失败:", error);
      toast.error("更新图片失败");
    }
  };

  const removePhotoWithApi = async (index: number) => {
    try {
      const response = await fetch("/api/admin/author/photos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index }),
      });
      const data = await response.json();
      if (!data.success) {
        toast.error(data.error || "删除图片失败");
        return;
      }
      await syncPhotosToServer(data.data || []);
      toast.success("图片已删除");
    } catch (error) {
      console.error("删除图片失败:", error);
      toast.error("删除图片失败");
    }
  };

  const openCreatePhotoDialog = () => {
    setEditingPhotoIndex(null);
    setPhotoFormUrl("");
    setPhotoDialogOpen(true);
  };

  const openEditPhotoDialog = (index: number, url: string) => {
    setEditingPhotoIndex(index);
    setPhotoFormUrl(url);
    setPhotoDialogOpen(true);
  };

  const openPreviewDialog = (url: string) => {
    setPreviewImageUrl(url);
    setPreviewDialogOpen(true);
  };

  const submitPhotoForm = async () => {
    const url = photoFormUrl.trim();
    if (!url) {
      toast.error("图片 URL 不能为空");
      return;
    }

    try {
      setFormSubmitting(true);
      if (editingPhotoIndex === null) {
        await addPhotoWithApi(url);
      } else {
        await updatePhotoWithApi(editingPhotoIndex, url);
      }
      setPhotoDialogOpen(false);
      fetchData();
    } finally {
      setFormSubmitting(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!data.success || !data.url) {
        toast.error(data.error || "图片上传失败");
        return;
      }

      if (profile.photos.includes(data.url)) {
        toast.success("图片已存在");
        return;
      }

      const photoResponse = await fetch("/api/admin/author/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: data.url }),
      });
      const photoData = await photoResponse.json();
      if (!photoData.success) {
        toast.error(photoData.error || "图片入库失败");
        return;
      }

      await syncPhotosToServer(photoData.data || []);
      toast.success("图片上传成功");
    } catch (error) {
      console.error("图片上传失败:", error);
      toast.error("图片上传失败");
    } finally {
      setUploadingPhoto(false);
      event.target.value = "";
    }
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
        <Button variant="outline" onClick={handleSyncResumeTemplate}>
          一键同步简历模板
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">基本信息</TabsTrigger>
          <TabsTrigger value="photos">作者图片</TabsTrigger>
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
                    onKeyDown={(e) => e.key === "Enter" && handleAddHobby()}
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

        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle>作者图片管理</CardTitle>
              <CardDescription>支持新增、编辑、删除和上传作者展示图片</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={openCreatePhotoDialog}>
                  <ImagePlus className="w-4 h-4 mr-1" /> 新增图片
                </Button>
                <div className="flex items-center gap-2">
                  <Input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                  <Button type="button" variant="outline" disabled={uploadingPhoto}>
                    {uploadingPhoto ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                    上传
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {profile.photos.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">暂无作者图片</p>
                ) : (
                  profile.photos.map((photo, index) => (
                    <div key={`${photo}-${index}`} className="flex items-center gap-4 rounded-lg border p-3">
                      <img src={photo} alt={`作者图片${index + 1}`} className="h-20 w-20 rounded-md object-cover border" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">图片 #{index + 1}</p>
                        <p className="text-xs text-muted-foreground break-all">{photo}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openPreviewDialog(photo)}>
                          预览
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditPhotoDialog(index, photo)}>
                          编辑
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => removePhotoWithApi(index)}>
                          删除
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
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
              <div className="mb-4">
                <Button size="sm" onClick={openCreateSkillDialog}>
                  <Plus className="w-4 h-4 mr-1" /> 新增技能
                </Button>
              </div>
              <div className="space-y-4">
                {skills.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{skill.name}</p>
                      <p className="text-sm text-muted-foreground">分类: {skill.category} · 熟练度: {skill.level}%</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditSkillDialog(skill)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => requestDelete({ type: "skills", id: skill.id, label: skill.name })}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
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
              <div className="mb-4">
                <Button size="sm" onClick={openCreateExperienceDialog}>
                  <Plus className="w-4 h-4 mr-1" /> 新增工作经历
                </Button>
              </div>
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
                    {exp.achievements?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">职责: {exp.achievements.join(" / ")}</p>
                    )}
                    {exp.techStack?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">技术栈: {exp.techStack.join(" · ")}</p>
                    )}
                    <div className="flex gap-1 mt-3">
                      <Button variant="outline" size="sm" onClick={() => openEditExperienceDialog(exp)}>
                        编辑
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => requestDelete({ type: "experiences", id: exp.id, label: `${exp.company} - ${exp.position}` })}
                      >
                        删除
                      </Button>
                    </div>
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
              <div className="mb-4">
                <Button size="sm" onClick={openCreateEducationDialog}>
                  <Plus className="w-4 h-4 mr-1" /> 新增教育经历
                </Button>
              </div>
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
                    {edu.achievements?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">亮点: {edu.achievements.join(" / ")}</p>
                    )}
                    <div className="flex gap-1 mt-3">
                      <Button variant="outline" size="sm" onClick={() => openEditEducationDialog(edu)}>
                        编辑
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => requestDelete({ type: "education", id: edu.id, label: `${edu.school} - ${edu.major}` })}
                      >
                        删除
                      </Button>
                    </div>
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
              <div className="mb-4">
                <Button size="sm" onClick={openCreateHonorDialog}>
                  <Plus className="w-4 h-4 mr-1" /> 新增荣誉证书
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {honors.map((honor) => (
                  <div key={honor.id} className="p-4 border rounded-lg">
                    <p className="font-medium mb-1">{honor.title}</p>
                    {honor.issuer && <p className="text-sm text-muted-foreground">{honor.issuer}</p>}
                    {honor.date && <p className="text-xs text-muted-foreground mt-1">{honor.date}</p>}
                    {honor.description && <p className="text-xs mt-2 line-clamp-3">{honor.description}</p>}
                    <div className="flex gap-1 mt-3">
                      <Button variant="outline" size="sm" onClick={() => openEditHonorDialog(honor)}>
                        编辑
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => requestDelete({ type: "honors", id: honor.id, label: honor.title })}
                      >
                        删除
                      </Button>
                    </div>
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

      <Dialog open={skillDialogOpen} onOpenChange={setSkillDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingSkillId ? "编辑技能" : "新增技能"}</DialogTitle>
            <DialogDescription>完善技能名称、分类、熟练度和排序</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="skill-name">技能名称</Label>
              <Input
                id="skill-name"
                value={skillForm.name}
                onChange={(e) => setSkillForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="例如：React、TypeScript"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-category">技能分类</Label>
              <Input
                id="skill-category"
                value={skillForm.category}
                onChange={(e) => setSkillForm((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="例如：前端基础"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-level">熟练度 (0-100)</Label>
              <Input
                id="skill-level"
                type="number"
                min={0}
                max={100}
                value={skillForm.level}
                onChange={(e) => setSkillForm((prev) => ({ ...prev, level: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-order">排序值</Label>
              <Input
                id="skill-order"
                value={skillForm.sortOrder}
                onChange={(e) => setSkillForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
                placeholder="数字越小越靠前"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkillDialogOpen(false)} disabled={formSubmitting}>
              取消
            </Button>
            <Button onClick={submitSkillForm} disabled={formSubmitting}>
              {formSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={experienceDialogOpen} onOpenChange={setExperienceDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingExperienceId ? "编辑工作经历" : "新增工作经历"}</DialogTitle>
            <DialogDescription>支持维护公司、职责、技术栈和排序</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="exp-company">公司名称</Label>
              <Input
                id="exp-company"
                value={experienceForm.company}
                onChange={(e) => setExperienceForm((prev) => ({ ...prev, company: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-position">职位</Label>
              <Input
                id="exp-position"
                value={experienceForm.position}
                onChange={(e) => setExperienceForm((prev) => ({ ...prev, position: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-start">开始时间</Label>
              <Input
                id="exp-start"
                value={experienceForm.startDate}
                onChange={(e) => setExperienceForm((prev) => ({ ...prev, startDate: e.target.value }))}
                placeholder="例如：2024.03"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-end">结束时间</Label>
              <Input
                id="exp-end"
                value={experienceForm.endDate}
                onChange={(e) => setExperienceForm((prev) => ({ ...prev, endDate: e.target.value }))}
                placeholder="为空表示至今"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="exp-description">项目描述</Label>
              <Textarea
                id="exp-description"
                rows={3}
                value={experienceForm.description}
                onChange={(e) => setExperienceForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="exp-achievements">职责亮点（逗号分隔）</Label>
              <Textarea
                id="exp-achievements"
                rows={2}
                value={experienceForm.achievementsText}
                onChange={(e) => setExperienceForm((prev) => ({ ...prev, achievementsText: e.target.value }))}
                placeholder="例如：负责组件库重构, 首屏性能优化 40%"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="exp-tech">技术栈（逗号分隔）</Label>
              <Textarea
                id="exp-tech"
                rows={2}
                value={experienceForm.techStackText}
                onChange={(e) => setExperienceForm((prev) => ({ ...prev, techStackText: e.target.value }))}
                placeholder="例如：React, Next.js, TypeScript"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-order">排序值</Label>
              <Input
                id="exp-order"
                value={experienceForm.sortOrder}
                onChange={(e) => setExperienceForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExperienceDialogOpen(false)} disabled={formSubmitting}>
              取消
            </Button>
            <Button onClick={submitExperienceForm} disabled={formSubmitting}>
              {formSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={educationDialogOpen} onOpenChange={setEducationDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingEducationId ? "编辑教育经历" : "新增教育经历"}</DialogTitle>
            <DialogDescription>支持维护院校、专业、亮点和排序</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="edu-school">学校</Label>
              <Input
                id="edu-school"
                value={educationForm.school}
                onChange={(e) => setEducationForm((prev) => ({ ...prev, school: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edu-major">专业</Label>
              <Input
                id="edu-major"
                value={educationForm.major}
                onChange={(e) => setEducationForm((prev) => ({ ...prev, major: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edu-degree">学历</Label>
              <Input
                id="edu-degree"
                value={educationForm.degree}
                onChange={(e) => setEducationForm((prev) => ({ ...prev, degree: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edu-order">排序值</Label>
              <Input
                id="edu-order"
                value={educationForm.sortOrder}
                onChange={(e) => setEducationForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edu-start">开始时间</Label>
              <Input
                id="edu-start"
                value={educationForm.startDate}
                onChange={(e) => setEducationForm((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edu-end">结束时间</Label>
              <Input
                id="edu-end"
                value={educationForm.endDate}
                onChange={(e) => setEducationForm((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edu-description">描述</Label>
              <Textarea
                id="edu-description"
                rows={2}
                value={educationForm.description}
                onChange={(e) => setEducationForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edu-achievements">亮点（逗号分隔）</Label>
              <Textarea
                id="edu-achievements"
                rows={2}
                value={educationForm.achievementsText}
                onChange={(e) => setEducationForm((prev) => ({ ...prev, achievementsText: e.target.value }))}
                placeholder="例如：获国家奖学金, 竞赛一等奖"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEducationDialogOpen(false)} disabled={formSubmitting}>
              取消
            </Button>
            <Button onClick={submitEducationForm} disabled={formSubmitting}>
              {formSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={honorDialogOpen} onOpenChange={setHonorDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingHonorId ? "编辑荣誉" : "新增荣誉"}</DialogTitle>
            <DialogDescription>支持维护描述、证书图链接、排序</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="honor-title">荣誉名称</Label>
              <Input
                id="honor-title"
                value={honorForm.title}
                onChange={(e) => setHonorForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="honor-issuer">颁发机构</Label>
              <Input
                id="honor-issuer"
                value={honorForm.issuer}
                onChange={(e) => setHonorForm((prev) => ({ ...prev, issuer: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="honor-date">时间</Label>
              <Input
                id="honor-date"
                value={honorForm.date}
                onChange={(e) => setHonorForm((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="honor-image">证书图片 URL</Label>
              <Input
                id="honor-image"
                value={honorForm.imageUrl}
                onChange={(e) => setHonorForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="honor-description">描述</Label>
              <Textarea
                id="honor-description"
                rows={3}
                value={honorForm.description}
                onChange={(e) => setHonorForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="honor-order">排序值</Label>
              <Input
                id="honor-order"
                value={honorForm.sortOrder}
                onChange={(e) => setHonorForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHonorDialogOpen(false)} disabled={formSubmitting}>
              取消
            </Button>
            <Button onClick={submitHonorForm} disabled={formSubmitting}>
              {formSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingPhotoIndex === null ? "新增作者图片" : "编辑作者图片"}</DialogTitle>
            <DialogDescription>维护作者展示图片 URL，保存后即时生效。</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="author-photo-url">图片 URL</Label>
            <Input
              id="author-photo-url"
              value={photoFormUrl}
              onChange={(e) => setPhotoFormUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhotoDialogOpen(false)} disabled={formSubmitting}>
              取消
            </Button>
            <Button onClick={submitPhotoForm} disabled={formSubmitting}>
              {formSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 图片全屏预览 */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-full max-h-full p-0 bg-black/95">
          <div className="relative w-full h-screen flex items-center justify-center">
            <button
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
              onClick={() => setPreviewDialogOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <img 
              src={previewImageUrl} 
              alt="预览图片" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? `将删除：${deleteTarget.label}。该操作不可恢复。` : "该操作不可恢复。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={formSubmitting}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={formSubmitting}>
              {formSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
