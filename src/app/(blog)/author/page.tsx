"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'motion/react';
import {
    Mail,
    Phone,
    MapPin,
    User,
    GraduationCap,
    Briefcase,
    Smartphone,
    Award,
    Code,
    Calendar,
    Target,
    DollarSign,
    Users,
    Heart,
    Layers,
    Menu,
    X,
    Github,
    Linkedin,
    ChevronDown,
    Sparkles,
    Coffee
} from 'lucide-react';
import SkillRadar from '@/components/SkillRadar';
import ExperienceTimeline from '@/components/ExperienceTimeline';
import EducationSection from '@/components/EducationSection';
import HonorGallery from '@/components/HonorGallery';
import ProfileCard from '@/components/ProfileCard';
import ParticleBackground from '@/components/ParticleBackground';
import CustomCursor from '@/components/CustomCursor';
import TypeWriter from '@/components/TypeWriter';
import MagneticButton from '@/components/MagneticButton';
import FloatingElements from '@/components/FloatingElements';
import ChatAssistant from '@/components/ChatAssistant';
import SidebarNav from '@/components/SidebarNav';

const skillColorByCategory: Record<string, string> = {
    '前端基础': 'from-purple-500 to-pink-500',
    '框架技术': 'from-cyan-500 to-blue-500',
    '鸿蒙开发': 'from-pink-500 to-rose-500',
    '后端技能': 'from-green-500 to-teal-500',
    '工程化': 'from-yellow-500 to-orange-500',
    '性能优化': 'from-indigo-500 to-purple-500',
    '小程序': 'from-emerald-500 to-green-500',
    'Web3': 'from-fuchsia-500 to-purple-500',
    '通信': 'from-sky-500 to-cyan-500',
};

const skillIconByCategory: Record<string, typeof Code> = {
    '前端基础': Code,
    '框架技术': Layers,
    '鸿蒙开发': Smartphone,
    '后端技能': Briefcase,
    '工程化': Sparkles,
    '性能优化': Target,
    '小程序': Users,
    'Web3': Github,
    '通信': Phone,
};

const initialImages: string[] = [
    'https://eypphxaje0isjpo6.public.blob.vercel-storage.com/photos/a.jpg',
    'https://eypphxaje0isjpo6.public.blob.vercel-storage.com/photos/headshot-176395480323.jpg',
    'https://eypphxaje0isjpo6.public.blob.vercel-storage.com/photos/stylized-1768828943890.png',
    'https://eypphxaje0isjpo6.public.blob.vercel-storage.com/photos/stylized-1768829842681.png'
];

export default function App() {
    const [imagesState, setImagesState] = useState<string[]>(initialImages);
    const [isMobile, setIsMobile] = useState(false);
    const [authorData, setAuthorData] = useState<{
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
            photos?: string[];
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
    } | null>(null);

    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll();
    const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
    const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
    const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // 用于光晕效果的平滑过渡值
    const smoothMouseX = useSpring(mouseX, { damping: 25, stiffness: 400 });
    const smoothMouseY = useSpring(mouseY, { damping: 25, stiffness: 400 });
    const orbX = useTransform(smoothMouseX, [0, 1000], [-100, 100]);
    const orbY = useTransform(smoothMouseY, [0, 1000], [-100, 100]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const media = window.matchMedia('(max-width: 767px)');
            const update = () => setIsMobile(media.matches);
            update();
            media.addEventListener('change', update);
            return () => media.removeEventListener('change', update);
        }
    }, []);

    useEffect(() => {
        const fetchAuthorData = async () => {
            try {
                const response = await fetch('/api/author');
                const data = await response.json();
                if (data.success) {
                    setAuthorData(data.data);
                    if (Array.isArray(data.data?.profile?.photos) && data.data.profile.photos.length > 0) {
                        setImagesState(data.data.profile.photos);
                    }
                }
            } catch (error) {
                console.error('获取作者信息失败:', error);
            }
        };

        fetchAuthorData();

        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        const handleClick = (e: MouseEvent) => {
            const newRipple = {
                x: e.clientX,
                y: e.clientY,
                id: Date.now()
            };
            setRipples(prev => [...prev, newRipple]);
            setTimeout(() => {
                setRipples(prev => prev.filter(r => r.id !== newRipple.id));
            }, 1000);
        };

        if (!isMobile) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('click', handleClick);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('click', handleClick);
        };
    }, [mouseX, mouseY, isMobile]);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        element?.scrollIntoView({ behavior: 'smooth' });
    };

    const groupedSkills = authorData?.skills
        ? Object.entries(
            authorData.skills.reduce<Record<string, Array<{ name: string; level: string }>>>((acc, item) => {
                if (!acc[item.category]) {
                    acc[item.category] = [];
                }
                acc[item.category].push({ name: item.name, level: item.level });
                return acc;
            }, {})
        ).map(([category, items]) => ({
            category,
            icon: skillIconByCategory[category] || Code,
            items: items.map((item) => item.name),
            level:
                Math.round(
                    items.reduce((sum, item) => sum + Number(item.level || 0), 0) /
                    Math.max(items.length, 1)
                ) || 80,
            color: skillColorByCategory[category] || 'from-purple-500 to-pink-500',
        }))
        : undefined;

    const experienceData = authorData?.experiences?.map((exp, index) => {
        const projectName = exp.description?.startsWith('项目：')
            ? exp.description.replace('项目：', '').trim()
            : exp.description;
        return {
            period: `${exp.startDate} - ${exp.endDate}`,
            company: exp.company,
            position: exp.position,
            project: projectName || `${exp.company} 项目`,
            techStack: exp.techStack || [],
            description: exp.description || '',
            responsibilities: exp.achievements || [],
            color: ['from-purple-500 to-pink-500', 'from-cyan-500 to-blue-500', 'from-pink-500 to-rose-500'][index % 3],
        };
    });

    const educationData = authorData?.education?.[0]
        ? {
            school: authorData.education[0].school,
            major: authorData.education[0].major,
            degree: authorData.education[0].degree,
            startDate: authorData.education[0].startDate,
            endDate: authorData.education[0].endDate,
            courses: authorData.education[0].achievements || [],
        }
        : undefined;

    const honorData = authorData?.honors?.map((item) => ({ title: item.title }));

    const selfEvaluation = [
        '本人性格踏实稳重，严谨务实、有较强的抗压能力',
        '设计上具备良好的审美能力，有良好的代码编程习惯',
        '对互联网行业有较强的学习热情和自学能力，有较强的独立思考能力',
        '乐于在开发者社区Github上交流学习，将新的知识纳入自己的知识体系中',
        '擅于团队协作开发，沟通交流，有意进入贵司成为开发岗中的一员',
    ];

    return (
        <div ref={containerRef} className={`relative min-h-screen bg-black overflow-x-hidden ${isMobile ? '' : 'cursor-none'}`}>
            {/* Custom Cursor */}
            {!isMobile && <CustomCursor mouseX={mouseX} mouseY={mouseY} smoothMouseX={smoothMouseX} smoothMouseY={smoothMouseY} />}

            {/* Click Ripples */}
            {!isMobile && ripples.map(ripple => (
                <motion.div
                    key={ripple.id}
                    className="fixed pointer-events-none z-50"
                    style={{
                        left: ripple.x,
                        top: ripple.y,
                    }}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                >
                    <div className="w-20 h-20 -ml-10 -mt-10 rounded-full border-2 border-purple-500" />
                </motion.div>
            ))}

            {/* Floating Elements */}
            {!isMobile && <FloatingElements />}

            {/* Particle Background */}
            {!isMobile && <ParticleBackground />}

            {/* Gradient Orbs */}
            {!isMobile && <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute w-[600px] h-[600px] rounded-full bg-purple-600/30 blur-3xl"
                    style={{
                        x: orbX,
                        y: orbY,
                    }}
                />
                <motion.div
                    className="absolute top-1/4 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
                    animate={{
                        x: [0, 100, 0],
                        y: [0, 50, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                    }}
                />
                <motion.div
                    className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"
                    animate={{
                        x: [0, -50, 0],
                        y: [0, -100, 0],
                        scale: [1, 1.3, 1],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                    }}
                />
            </div>}

            {/* Sidebar Navigation */}
            {!isMobile && <SidebarNav />}

            {/* Scroll Progress */}
            {!isMobile && <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 origin-left z-50"
                style={{ scaleX: scrollYProgress }}
            />}

            {/* Hero Section */}
            <section id="hero" className={`relative min-h-screen flex items-center justify-center ${isMobile ? 'pt-8 pb-14' : 'pt-20'}`}>
                <motion.div
                    className={`container mx-auto ${isMobile ? 'px-4' : 'px-6'}`}
                    style={{ scale, opacity }}
                >
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start lg:items-center">
                        {/* Left: Profile Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -100, rotateY: -90 }}
                            animate={{ opacity: 1, x: 0, rotateY: 0 }}
                            transition={{ duration: 1, type: "spring", stiffness: 100 }}
                        >
                            <ProfileCard images={imagesState} />
                        </motion.div>

                        {/* Right: Hero Text */}
                        <motion.div
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className={`space-y-4 ${isMobile ? 'pt-2' : 'sm:space-y-6'}`}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <motion.h1
                                    className="text-4xl sm:text-5xl lg:text-7xl mb-3 sm:mb-4 leading-tight"
                                    style={{
                                        textShadow: "0 0 30px rgba(168, 85, 247, 0.3)"
                                    }}
                                >
                                    <motion.span
                                        className="text-white"
                                        initial={{ opacity: 0, x: -50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5, duration: 0.8 }}
                                    >
                                        你好，我是
                                    </motion.span>
                                    <br />
                                    <motion.span
                                        className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent inline-block"
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{
                                            opacity: 1,
                                            x: 0,
                                            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                                        }}
                                        transition={{
                                            opacity: { delay: 1.3, duration: 0.8 },
                                            x: { delay: 1.3, duration: 0.8 },
                                            backgroundPosition: { duration: 5, repeat: Infinity }
                                        }}
                                        style={{ backgroundSize: "200% 200%" }}
                                    >
                                        {authorData?.profile?.name || '李伟'}
                                    </motion.span>
                                </motion.h1>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className={`space-y-4 ${isMobile ? 'rounded-xl bg-white/[0.06] border border-white/10 p-4' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <motion.div
                                        className="h-1 w-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                                        animate={{
                                            width: [48, 60, 48],
                                            boxShadow: [
                                                "0 0 10px rgba(168, 85, 247, 0.5)",
                                                "0 0 20px rgba(168, 85, 247, 0.8)",
                                                "0 0 10px rgba(168, 85, 247, 0.5)",
                                            ]
                                        }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                    <TypeWriter
                                        text={authorData?.profile?.title || '前端开发师'}
                                        className="text-lg sm:text-2xl text-cyan-300"
                                        delay={1.5}
                                    />
                                </div>

                                <motion.p
                                    className="text-white/80 text-sm sm:text-lg leading-relaxed max-w-xl"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 2 }}
                                >
                                    {authorData?.profile?.bio || '专注于创造优秀的用户体验，精通现代前端技术栈，具备丰富的项目经验和持续学习的热情。'}
                                </motion.p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                className="flex flex-wrap gap-2 sm:gap-4 pt-2 sm:pt-4"
                            >
                                <MagneticButton onClick={() => scrollToSection('contact')}>
                                    <motion.div
                                        className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full relative overflow-hidden"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <motion.span
                                            className="relative z-10"
                                            animate={{
                                                textShadow: [
                                                    "0 0 10px rgba(255, 255, 255, 0.5)",
                                                    "0 0 20px rgba(255, 255, 255, 0.8)",
                                                    "0 0 10px rgba(255, 255, 255, 0.5)",
                                                ]
                                            }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            联系我
                                        </motion.span>
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-pink-500 to-cyan-500"
                                            initial={{ x: '100%' }}
                                            whileHover={{ x: 0 }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </motion.div>
                                </MagneticButton>

                                <MagneticButton onClick={() => scrollToSection('experience')}>
                                    <motion.div
                                        className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-full border border-white/20 hover:border-white/40 transition-colors"
                                        whileHover={{ scale: 1.05, borderColor: "rgba(255, 255, 255, 0.6)" }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        查看作品
                                    </motion.div>
                                </MagneticButton>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                className="flex flex-col gap-4 pt-6"
                            >
                                <MagneticButton>
                                    <motion.a
                                        href="/sponsor"
                                        className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all relative overflow-hidden group"
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 1, type: "spring" }}
                                        whileHover={{
                                            scale: 1.3,
                                            rotate: 360,
                                            boxShadow: "0 0 20px rgba(168, 85, 247, 0.6)"
                                        }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <Coffee className="w-6 h-6 relative z-10" />
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500"
                                            initial={{ scale: 0 }}
                                            whileHover={{ scale: 1 }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </motion.a>
                                </MagneticButton>
                                <motion.p
                                    className="text-white/80 text-sm font-medium"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.2 }}
                                    whileHover={{ scale: 1.1, color: "#ffffff" }}
                                >
                                    请我喝杯咖啡吧～ 代码更香浓 😊
                                </motion.p>
                            </motion.div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2"
                    animate={{
                        y: [0, 15, 0],
                        opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <motion.div
                        whileHover={{ scale: 1.5 }}
                        className="cursor-pointer"
                        onClick={() => scrollToSection('about')}
                    >
                        <ChevronDown className="w-8 h-8 text-white/50" />
                    </motion.div>
                </motion.div>
            </section>

            {isMobile && (
                <div className="fixed bottom-14 left-1/2 z-40 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-[11px] text-white/90">
                    预览中支持左右滑动切换
                </div>
            )}

            {/* About Section */}
            <section id="about" className={`relative ${isMobile ? 'py-10' : 'py-32'}`}>
                <div className={`container mx-auto ${isMobile ? 'px-4' : 'px-6'}`}>
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-4xl mx-auto"
                    >
                        <motion.h2
                            className="text-5xl text-white mb-16 text-center"
                            whileInView={{
                                scale: [0.8, 1.05, 1],
                                rotate: [0, 5, 0]
                            }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                                关于我
                            </span>
                        </motion.h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            {[
                                { icon: User, label: '性别', value: authorData?.profile?.gender || '男' },
                                { icon: Calendar, label: '年龄', value: authorData?.profile?.age || '24' },
                                { icon: Phone, label: '联系电话', value: authorData?.profile?.phone || '13043428526' },
                                { icon: GraduationCap, label: '学历', value: authorData?.profile?.education || '本科' },
                                { icon: MapPin, label: '户籍', value: authorData?.profile?.location || '江西 · 汉族' },
                                { icon: Target, label: '意向城市', value: authorData?.profile?.preferredCity || '全国' },
                                { icon: Briefcase, label: '意向岗位', value: authorData?.profile?.preferredPosition || '前端开发师' },
                                { icon: DollarSign, label: '期望薪资', value: authorData?.profile?.expectedSalary || '面议' },
                            ].map((item, index) => (
                                <motion.div
                                    key={item.label}
                                    initial={{ opacity: 0, scale: 0.5, rotateY: -90 }}
                                    whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                                    viewport={{ once: true }}
                                    transition={{
                                        delay: index * 0.1,
                                        type: "spring",
                                        stiffness: 100
                                    }}
                                    whileHover={{
                                        scale: 1.05,
                                        rotateZ: 2,
                                        y: -10,
                                        boxShadow: "0 20px 40px rgba(168, 85, 247, 0.3)"
                                    }}
                                    className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all group cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <motion.div
                                            className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center"
                                            whileHover={{
                                                scale: 1.2,
                                                rotate: 360,
                                                boxShadow: "0 0 20px rgba(168, 85, 247, 0.6)"
                                            }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            <item.icon className="w-6 h-6 text-purple-400" />
                                        </motion.div>
                                        <div>
                                            <p className="text-white/50 text-sm">{item.label}</p>
                                            <motion.p
                                                className="text-white text-lg"
                                                whileHover={{ x: 5 }}
                                            >
                                                {item.value}
                                            </motion.p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Skills Section */}
            <section id="skills" className={`relative ${isMobile ? 'py-10' : 'py-32'} bg-white/5`}>
                <div className={`container mx-auto ${isMobile ? 'px-4' : 'px-6'}`}>
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6 }}
                    >
                        <motion.h2
                            className="text-5xl text-white mb-16 text-center"
                            whileInView={{
                                scale: [0.8, 1.05, 1],
                                rotate: [0, -5, 0]
                            }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                技术特长
                            </span>
                        </motion.h2>

                        <SkillRadar skillsData={groupedSkills} />
                    </motion.div>
                </div>
            </section>

            {/* Experience Section */}
            <section id="experience" className={`relative ${isMobile ? 'py-10' : 'py-32'}`}>
                <div className={`container mx-auto ${isMobile ? 'px-4' : 'px-6'}`}>
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6 }}
                    >
                        <motion.h2
                            className="text-5xl text-white mb-16 text-center"
                            whileInView={{
                                scale: [0.8, 1.05, 1],
                                rotate: [0, 5, 0]
                            }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                                工作经历
                            </span>
                        </motion.h2>

                        <ExperienceTimeline experiencesData={experienceData} />
                    </motion.div>
                </div>
            </section>

            {/* Education Section */}
            <section id="education" className={`relative ${isMobile ? 'py-10' : 'py-32'} bg-white/5`}>
                <div className={`container mx-auto ${isMobile ? 'px-4' : 'px-6'}`}>
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6 }}
                    >
                        <motion.h2
                            className="text-5xl text-white mb-16 text-center"
                            whileInView={{
                                scale: [0.8, 1.05, 1],
                                rotate: [0, -5, 0]
                            }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                                教育经历
                            </span>
                        </motion.h2>

                        <EducationSection educationData={educationData} />
                    </motion.div>
                </div>
            </section>

            {/* Honors Section */}
            <section id="honors" className={`relative ${isMobile ? 'py-10' : 'py-32'}`}>
                <div className={`container mx-auto ${isMobile ? 'px-4' : 'px-6'}`}>
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6 }}
                    >
                        <motion.h2
                            className="text-5xl text-white mb-16 text-center"
                            whileInView={{
                                scale: [0.8, 1.05, 1],
                                rotate: [0, 5, 0]
                            }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                                荣誉证书
                            </span>
                        </motion.h2>

                        <HonorGallery honorsData={honorData} selfEvaluation={selfEvaluation} />
                    </motion.div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className={`relative ${isMobile ? 'py-10' : 'py-32'} bg-white/5`}>
                <div className={`container mx-auto ${isMobile ? 'px-4' : 'px-6'}`}>
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-4xl mx-auto text-center"
                    >
                        <motion.h2
                            className="text-5xl text-white mb-8"
                            whileInView={{
                                scale: [0.8, 1.05, 1],
                                rotate: [0, -5, 0]
                            }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                让我们一起创造精彩
                            </span>
                        </motion.h2>

                        <motion.p
                            className="text-white/70 text-xl mb-12 leading-relaxed"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                        >
                            对前端技术有持续学习的热情，每周保持阅读技术博客和参与开源项目的习惯。
                            <br />
                            擅于团队协作开发，沟通交流，有意进入贵司成为开发岗中的一员。
                        </motion.p>

                        <MagneticButton>
                            <motion.div
                                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xl cursor-pointer"
                                whileHover={{
                                    scale: 1.1,
                                    boxShadow: "0 0 40px rgba(168, 85, 247, 0.8)"
                                }}
                                whileTap={{ scale: 0.95 }}
                                animate={{
                                    boxShadow: [
                                        "0 0 20px rgba(168, 85, 247, 0.3)",
                                        "0 0 40px rgba(168, 85, 247, 0.6)",
                                        "0 0 20px rgba(168, 85, 247, 0.3)",
                                    ]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Phone className="w-6 h-6" />
                                <span>{authorData?.profile?.phone || '13043428526'}</span>
                            </motion.div>
                        </MagneticButton>

                        <div className="mt-12 pt-12 border-t border-white/10">
                            <div className="flex items-center justify-center gap-3 text-white/70 mb-6">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Heart className="w-5 h-5 text-pink-400" />
                                </motion.div>
                                <span className="text-lg">兴趣爱好</span>
                            </div>
                            <div className="flex flex-wrap justify-center gap-3">
                                {(authorData?.profile?.hobbies?.length ? authorData.profile.hobbies : ['台球', '乒乓球', '羽毛球', '篮球', '骑行', '平面设计', '绘画']).map((hobby, index) => (
                                    <motion.span
                                        key={hobby}
                                        initial={{ opacity: 0, scale: 0, rotate: -180 }}
                                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                                        viewport={{ once: true }}
                                        transition={{
                                            delay: index * 0.1,
                                            type: "spring",
                                            stiffness: 200
                                        }}
                                        whileHover={{
                                            scale: 1.2,
                                            rotateZ: 10,
                                            y: -5,
                                            boxShadow: "0 10px 30px rgba(168, 85, 247, 0.5)"
                                        }}
                                        className="px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-full text-white border border-white/20 hover:border-purple-400/50 transition-all cursor-pointer"
                                    >
                                        {hobby}
                                    </motion.span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative py-12 border-t border-white/10">
                <div className="container mx-auto px-6 text-center">
                    <motion.p
                        className="text-white/50"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        © 2024 {authorData?.profile?.name || '李伟'}. All rights reserved.
                    </motion.p>
                </div>
            </footer>
            <ChatAssistant />
        </div>
    );
}
