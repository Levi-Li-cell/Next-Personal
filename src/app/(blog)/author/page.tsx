"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'motion/react';
import { useRouter } from 'next/navigation';
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
    Coffee,
    Gamepad2,
    Sun,
    Cloud,
    CloudRain,
    CloudFog,
    CloudSnow,
    CloudLightning,
    LocateFixed,
    Search,
    RefreshCw
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
import { useSession } from '@/lib/auth/client';
import { toast } from 'sonner';

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

const weatherCodeMeta: Record<number, { label: string; icon: typeof Sun }> = {
    0: { label: '晴朗', icon: Sun },
    1: { label: '大部晴朗', icon: Sun },
    2: { label: '局部多云', icon: Cloud },
    3: { label: '阴天', icon: Cloud },
    45: { label: '有雾', icon: CloudFog },
    48: { label: '冻雾', icon: CloudFog },
    51: { label: '毛毛雨', icon: CloudRain },
    53: { label: '小雨', icon: CloudRain },
    55: { label: '中雨', icon: CloudRain },
    56: { label: '冻雨', icon: CloudRain },
    57: { label: '强冻雨', icon: CloudRain },
    61: { label: '小雨', icon: CloudRain },
    63: { label: '中雨', icon: CloudRain },
    65: { label: '大雨', icon: CloudRain },
    66: { label: '冻雨', icon: CloudRain },
    67: { label: '强冻雨', icon: CloudRain },
    71: { label: '小雪', icon: CloudSnow },
    73: { label: '中雪', icon: CloudSnow },
    75: { label: '大雪', icon: CloudSnow },
    77: { label: '阵雪', icon: CloudSnow },
    80: { label: '阵雨', icon: CloudRain },
    81: { label: '强阵雨', icon: CloudRain },
    82: { label: '暴雨阵雨', icon: CloudRain },
    85: { label: '阵雪', icon: CloudSnow },
    86: { label: '强阵雪', icon: CloudSnow },
    95: { label: '雷暴', icon: CloudLightning },
    96: { label: '雷暴冰雹', icon: CloudLightning },
    99: { label: '强雷暴冰雹', icon: CloudLightning },
};

type WeatherSource = 'gps' | 'ip' | 'manual' | 'fallback';

export default function App() {
    const router = useRouter();
    const { data: session } = useSession();
    const [imagesState, setImagesState] = useState<string[]>(initialImages);
    const [isMobile, setIsMobile] = useState(false);
    const [now, setNow] = useState(new Date());
    const [mobileSection, setMobileSection] = useState<'about' | 'skills' | 'experience' | 'education' | 'honors' | 'contact'>('about');
    const [weatherData, setWeatherData] = useState<{
        temperature: number;
        weatherCode: number;
        windSpeed: number;
        city: string;
        fallbackLocation: boolean;
        source: WeatherSource;
        hourlyTrend: Array<{ time: string; temperature: number; weatherCode: number }>;
    } | null>(null);
    const [manualCityInput, setManualCityInput] = useState('');
    const [manualCityQuery, setManualCityQuery] = useState<string | null>(null);
    const [weatherRefreshToken, setWeatherRefreshToken] = useState(0);
    const [isWeatherLoading, setIsWeatherLoading] = useState(false);
    const [weatherError, setWeatherError] = useState('');
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

    const weatherMeta = weatherData ? (weatherCodeMeta[weatherData.weatherCode] || { label: '天气变化中', icon: Cloud }) : null;
    const WeatherIcon = weatherMeta?.icon || Cloud;
    const weatherSourceText = weatherData?.source === 'gps'
        ? 'GPS定位'
        : weatherData?.source === 'ip'
            ? 'IP定位'
            : weatherData?.source === 'manual'
                ? '手动查询'
                : '默认城市';
    const hourlyTrend = weatherData?.hourlyTrend || [];
    const trendTemps = hourlyTrend.map((item) => item.temperature);
    const minTrendTemp = trendTemps.length ? Math.min(...trendTemps) : 0;
    const maxTrendTemp = trendTemps.length ? Math.max(...trendTemps) : 0;

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const media = window.matchMedia('(max-width: 767px), (hover: none), (pointer: coarse)');
            const update = () => setIsMobile(media.matches);
            update();
            media.addEventListener('change', update);
            return () => media.removeEventListener('change', update);
        }
    }, []);

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        const fallbackCoords = {
            latitude: 39.9042,
            longitude: 116.4074,
            city: '北京',
            fallbackLocation: true,
        };

        const fetchWeatherByCoords = async (
            latitude: number,
            longitude: number,
            source: WeatherSource,
            fallbackLocation: boolean,
            seedCity?: string
        ) => {
            setIsWeatherLoading(true);
            setWeatherError('');
            try {
                const weatherResponse = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&forecast_days=2&timezone=auto`
                );
                if (!weatherResponse.ok) {
                    throw new Error('weather fetch failed');
                }
                const weatherJson = await weatherResponse.json();
                const current = weatherJson?.current;
                if (!current) {
                    throw new Error('weather current data missing');
                }

                const hourlyTimes: string[] = weatherJson?.hourly?.time || [];
                const hourlyTemps: number[] = weatherJson?.hourly?.temperature_2m || [];
                const hourlyCodes: number[] = weatherJson?.hourly?.weather_code || [];
                const currentTimestamp = new Date(current.time || Date.now()).getTime();

                const nextHours = hourlyTimes
                    .map((time, index) => ({
                        time,
                        temperature: Number(hourlyTemps[index]),
                        weatherCode: Number(hourlyCodes[index]),
                        timestamp: new Date(time).getTime(),
                    }))
                    .filter((item) => Number.isFinite(item.timestamp) && item.timestamp >= currentTimestamp)
                    .slice(0, 8)
                    .map(({ time, temperature, weatherCode }) => ({ time, temperature, weatherCode }));

                let city = seedCity || fallbackCoords.city;
                try {
                    const geoResponse = await fetch(
                        `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=zh&count=1`
                    );
                    if (geoResponse.ok) {
                        const geoJson = await geoResponse.json();
                        const result = geoJson?.results?.[0];
                        city = result?.city || result?.name || city;
                    }
                } catch {
                    city = seedCity || fallbackCoords.city;
                }

                setWeatherData({
                    temperature: Number(current.temperature_2m),
                    weatherCode: Number(current.weather_code),
                    windSpeed: Number(current.wind_speed_10m),
                    city,
                    source,
                    fallbackLocation,
                    hourlyTrend: nextHours,
                });
            } catch {
                setWeatherError('天气加载失败，请稍后重试');
            } finally {
                setIsWeatherLoading(false);
            }
        };

        const fetchWeather = async () => {
            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    if (!navigator.geolocation) {
                        reject(new Error('geolocation unavailable'));
                        return;
                    }
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 9000,
                        maximumAge: 5 * 60 * 1000,
                    });
                });

                await fetchWeatherByCoords(position.coords.latitude, position.coords.longitude, 'gps', false);
                return;
            } catch {
                // gps 失败继续尝试 ip 定位
            }

            try {
                const ipResp = await fetch('https://ipapi.co/json/');
                if (ipResp.ok) {
                    const ipData = await ipResp.json();
                    if (Number.isFinite(Number(ipData?.latitude)) && Number.isFinite(Number(ipData?.longitude))) {
                        await fetchWeatherByCoords(Number(ipData.latitude), Number(ipData.longitude), 'ip', false, ipData?.city || 'IP定位城市');
                        return;
                    }
                }
            } catch {
                // ip 失败继续默认城市
            }

            await fetchWeatherByCoords(fallbackCoords.latitude, fallbackCoords.longitude, 'fallback', true, fallbackCoords.city);
        };

        fetchWeather();
        const interval = window.setInterval(fetchWeather, 30 * 60 * 1000);
        return () => window.clearInterval(interval);
    }, [weatherRefreshToken]);

    useEffect(() => {
        if (!manualCityQuery) {
            return;
        }

        const searchCityWeather = async () => {
            setIsWeatherLoading(true);
            setWeatherError('');
            try {
                const geoResponse = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(manualCityQuery)}&language=zh&count=1`
                );
                if (!geoResponse.ok) {
                    throw new Error('city geocode failed');
                }
                const geoJson = await geoResponse.json();
                const result = geoJson?.results?.[0];
                if (!result || !Number.isFinite(Number(result.latitude)) || !Number.isFinite(Number(result.longitude))) {
                    setWeatherError('未找到该城市，请尝试更具体的地名');
                    return;
                }

                const weatherResponse = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${result.latitude}&longitude=${result.longitude}&current=temperature_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&forecast_days=2&timezone=auto`
                );
                if (!weatherResponse.ok) {
                    throw new Error('weather fetch failed');
                }
                const weatherJson = await weatherResponse.json();
                const current = weatherJson?.current;
                if (!current) {
                    throw new Error('weather current data missing');
                }

                const hourlyTimes: string[] = weatherJson?.hourly?.time || [];
                const hourlyTemps: number[] = weatherJson?.hourly?.temperature_2m || [];
                const hourlyCodes: number[] = weatherJson?.hourly?.weather_code || [];
                const currentTimestamp = new Date(current.time || Date.now()).getTime();
                const nextHours = hourlyTimes
                    .map((time, index) => ({
                        time,
                        temperature: Number(hourlyTemps[index]),
                        weatherCode: Number(hourlyCodes[index]),
                        timestamp: new Date(time).getTime(),
                    }))
                    .filter((item) => Number.isFinite(item.timestamp) && item.timestamp >= currentTimestamp)
                    .slice(0, 8)
                    .map(({ time, temperature, weatherCode }) => ({ time, temperature, weatherCode }));

                setWeatherData({
                    temperature: Number(current.temperature_2m),
                    weatherCode: Number(current.weather_code),
                    windSpeed: Number(current.wind_speed_10m),
                    city: result.city || result.name || manualCityQuery,
                    source: 'manual',
                    fallbackLocation: false,
                    hourlyTrend: nextHours,
                });
            } catch {
                setWeatherError('手动查询失败，请稍后重试');
            } finally {
                setIsWeatherLoading(false);
            }
        };

        searchCityWeather();
    }, [manualCityQuery]);

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

    const mobileSections = [
        { key: 'about', label: '关于', hint: '基础资料与求职意向' },
        { key: 'skills', label: '技能', hint: '技术栈与核心能力' },
        { key: 'experience', label: '经历', hint: '项目与岗位经验' },
        { key: 'education', label: '教育', hint: '学校与主修方向' },
        { key: 'honors', label: '荣誉', hint: '证书与奖项' },
        { key: 'contact', label: '联系', hint: '沟通方式与兴趣爱好' },
    ] as const;

    const mobileSectionIndex = Math.max(0, mobileSections.findIndex((item) => item.key === mobileSection));
    const activeMobileSection = mobileSections[mobileSectionIndex] || mobileSections[0];

    const gotoPrevMobileSection = () => {
        const prevIndex = (mobileSectionIndex - 1 + mobileSections.length) % mobileSections.length;
        setMobileSection(mobileSections[prevIndex].key);
    };

    const gotoNextMobileSection = () => {
        const nextIndex = (mobileSectionIndex + 1) % mobileSections.length;
        setMobileSection(mobileSections[nextIndex].key);
    };

    const goSnakeGame = () => {
        if (!session?.user?.id) {
            toast.error('小游戏仅登录用户可访问');
            router.push('/signin?redirect=/snake3d');
            return;
        }
        router.push('/snake3d');
    };

    const goGeoLab = () => {
        router.push('/geo-lab');
    };

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
            <section id="hero" className={`relative flex items-center justify-center ${isMobile ? 'min-h-[78vh] pt-6 pb-8' : 'min-h-screen pt-20'}`}>
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
                                className={`space-y-4 ${isMobile ? 'rounded-xl bg-white/[0.08] p-4' : ''}`}
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
                                    className="text-white/90 text-base sm:text-lg leading-relaxed max-w-xl"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 2 }}
                                >
                                    {authorData?.profile?.bio || '专注于创造优秀的用户体验，精通现代前端技术栈，具备丰富的项目经验和持续学习的热情。'}
                                </motion.p>

                                <motion.div
                                    className="relative overflow-hidden rounded-2xl border border-cyan-300/25 bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-purple-500/15 p-4 backdrop-blur-xl"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.75 }}
                                >
                                    <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-cyan-300/20 blur-2xl" />
                                    <div className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-purple-400/20 blur-2xl" />
                                    <div className="relative flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/80">Live Weather</p>
                                            <p className="mt-1 text-white text-lg font-semibold">
                                                {now.toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
                                            </p>
                                            <p className="text-sm text-white/80">
                                                {now.toLocaleTimeString('zh-CN', { hour12: false })}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                                            <WeatherIcon className="h-5 w-5 text-cyan-200" />
                                            <div className="text-right">
                                                <p className="text-base font-semibold text-white">
                                                    {weatherData ? `${Math.round(weatherData.temperature)}°C` : '--°C'}
                                                </p>
                                                <p className="text-xs text-white/75">{isWeatherLoading ? '天气刷新中' : (weatherMeta?.label || '天气加载中')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative mt-3 flex flex-wrap items-center gap-3 text-xs text-white/75">
                                        <span className="rounded-full bg-white/10 px-2.5 py-1">
                                            城市：{weatherData?.city || '定位中'}
                                        </span>
                                        <span className="rounded-full bg-white/10 px-2.5 py-1">
                                            风速：{weatherData ? `${Math.round(weatherData.windSpeed)} km/h` : '--'}
                                        </span>
                                        <span className="rounded-full bg-cyan-500/20 px-2.5 py-1 text-cyan-100">
                                            来源：{weatherSourceText}
                                        </span>
                                        {weatherData?.fallbackLocation && (
                                            <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-amber-100">
                                                定位不可用，已切换默认城市
                                            </span>
                                        )}
                                    </div>

                                    <div className="relative mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <div className="relative flex-1">
                                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                                            <input
                                                value={manualCityInput}
                                                onChange={(e) => setManualCityInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const value = manualCityInput.trim();
                                                        if (value) {
                                                            setManualCityQuery(value);
                                                        }
                                                    }
                                                }}
                                                placeholder="输入城市名（如：井冈山、吉安、上海）"
                                                className="w-full rounded-xl border border-white/15 bg-white/10 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/45"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const value = manualCityInput.trim();
                                                    if (value) {
                                                        setManualCityQuery(value);
                                                    }
                                                }}
                                                className="rounded-xl bg-white/12 px-3 py-2 text-xs text-white hover:bg-white/20"
                                            >
                                                查询城市
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setWeatherRefreshToken((prev) => prev + 1)}
                                                className="inline-flex items-center gap-1 rounded-xl bg-cyan-500/25 px-3 py-2 text-xs text-cyan-100 hover:bg-cyan-500/35"
                                            >
                                                <LocateFixed className="h-3.5 w-3.5" />
                                                重新定位
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setWeatherRefreshToken((prev) => prev + 1)}
                                                className="inline-flex items-center gap-1 rounded-xl bg-indigo-500/25 px-3 py-2 text-xs text-indigo-100 hover:bg-indigo-500/35"
                                            >
                                                <RefreshCw className="h-3.5 w-3.5" />
                                                刷新
                                            </button>
                                        </div>
                                    </div>

                                    {weatherError && (
                                        <p className="relative mt-2 text-xs text-amber-200">{weatherError}</p>
                                    )}

                                    {hourlyTrend.length > 0 && (
                                        <div className="relative mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                                            <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">未来天气趋势</p>
                                            <div className="mt-3 grid grid-cols-8 gap-2">
                                                {hourlyTrend.map((point) => {
                                                    const pointMeta = weatherCodeMeta[point.weatherCode] || { label: '天气变化中', icon: Cloud };
                                                    const PointIcon = pointMeta.icon;
                                                    const barHeight = maxTrendTemp === minTrendTemp
                                                        ? 42
                                                        : 24 + ((point.temperature - minTrendTemp) / (maxTrendTemp - minTrendTemp)) * 44;

                                                    return (
                                                        <div key={point.time} className="flex flex-col items-center gap-1.5 text-white/85">
                                                            <span className="text-[10px] text-white/60">
                                                                {new Date(point.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                            </span>
                                                            <div className="flex h-16 w-full items-end justify-center">
                                                                <div
                                                                    className="w-3 rounded-full bg-gradient-to-t from-cyan-500/70 to-blue-200/80"
                                                                    style={{ height: `${barHeight}px` }}
                                                                />
                                                            </div>
                                                            <PointIcon className="h-3.5 w-3.5 text-cyan-100" />
                                                            <span className="text-[10px]">{Math.round(point.temperature)}°</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </motion.div>

                            {isMobile ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="space-y-3"
                                >
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="rounded-xl bg-white/[0.10] px-3 py-2">
                                            <p className="text-xs text-white/75">意向岗位</p>
                                            <p className="mt-1 text-sm text-white">{authorData?.profile?.preferredPosition || '前端开发师'}</p>
                                        </div>
                                        <div className="rounded-xl bg-white/[0.10] px-3 py-2">
                                            <p className="text-xs text-white/75">意向城市</p>
                                            <p className="mt-1 text-sm text-white">{authorData?.profile?.preferredCity || '全国'}</p>
                                        </div>
                                        <div className="rounded-xl bg-white/[0.10] px-3 py-2">
                                            <p className="text-xs text-white/75">期望薪资</p>
                                            <p className="mt-1 text-sm text-white">{authorData?.profile?.expectedSalary || '面议'}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <a
                                            href={`tel:${authorData?.profile?.phone || '13043428526'}`}
                                            className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-2 text-center text-sm font-medium text-white"
                                        >
                                            电话联系
                                        </a>
                                        <button
                                            className="rounded-xl bg-white/[0.14] px-3 py-2 text-sm text-white"
                                            onClick={() => scrollToSection('experience')}
                                        >
                                            查看经历
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {(authorData?.profile?.hobbies?.slice(0, 4) || ['台球', '乒乓球', '羽毛球', '骑行']).map((hobby) => (
                                            <span key={hobby} className="rounded-full bg-white/[0.14] px-2.5 py-1 text-xs text-white/90">
                                                {hobby}
                                            </span>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                <>
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
                                                <motion.span className="relative z-10">联系我</motion.span>
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
                                        <motion.div
                                            className="rounded-2xl border border-cyan-300/30 bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-indigo-500/15 p-4"
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 1.02 }}
                                        >
                                            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/85">Spatial Lab</p>
                                            <p className="mt-1 text-sm text-white font-medium">空间分析实验室（GIS + WebGL）</p>
                                            <p className="mt-1 text-xs text-white/75 leading-relaxed">
                                                查看我在 GeoJSON/GML/Shapefile 解析、Turf.js 空间分析、MapLibre 地图可视化与 Three.js 3D 面挤出方面的实战能力。
                                            </p>
                                            <button
                                                type="button"
                                                onClick={goGeoLab}
                                                className="mt-3 inline-flex items-center rounded-xl bg-cyan-500/25 px-3 py-2 text-xs text-cyan-100 hover:bg-cyan-500/35"
                                            >
                                                进入空间实验室
                                            </button>
                                        </motion.div>

                                        <MagneticButton>
                                            <motion.button
                                                type="button"
                                                onClick={goSnakeGame}
                                                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-300/30 px-4 py-2 text-sm text-white hover:from-cyan-500/50 hover:to-blue-500/50"
                                                whileHover={{ scale: 1.06 }}
                                                whileTap={{ scale: 0.96 }}
                                            >
                                                <Gamepad2 className="w-4 h-4" />
                                                工作辛苦了来玩会儿游戏吧
                                            </motion.button>
                                        </MagneticButton>

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
                                        <motion.p className="text-white/80 text-sm font-medium">请我喝杯咖啡吧～ 代码更香浓 😊</motion.p>
                                    </motion.div>
                                </>
                            )}
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
                <section className="relative py-3">
                    <div className="container mx-auto px-4">
                        <div className="mb-3 rounded-2xl bg-white/[0.08] p-3">
                            <div className="flex items-center justify-between">
                                <button
                                    className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white"
                                    onClick={gotoPrevMobileSection}
                                >
                                    上一项
                                </button>
                                <div className="text-center">
                                    <p className="text-base text-white font-medium">{activeMobileSection.label}</p>
                                    <p className="text-xs text-white/70">{activeMobileSection.hint}</p>
                                </div>
                                <button
                                    className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white"
                                    onClick={gotoNextMobileSection}
                                >
                                    下一项
                                </button>
                            </div>
                            <div className="mt-3 h-1 rounded-full bg-white/10">
                                <div
                                    className="h-1 rounded-full bg-gradient-to-r from-purple-400 to-cyan-400"
                                    style={{ width: `${((mobileSectionIndex + 1) / mobileSections.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        {mobileSection === 'about' && (
                            <div className="space-y-2">
                                <div className="relative overflow-hidden rounded-xl border border-cyan-200/20 bg-gradient-to-br from-cyan-500/25 via-blue-500/10 to-purple-500/20 p-3">
                                    <div className="absolute -right-6 -top-8 h-20 w-20 rounded-full bg-cyan-300/20 blur-2xl" />
                                    <div className="relative flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/80">Weather</p>
                                            <p className="text-sm text-white font-medium">
                                                {now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}
                                            </p>
                                            <p className="text-xs text-white/80">{now.toLocaleTimeString('zh-CN', { hour12: false })}</p>
                                        </div>
                                        <div className="rounded-lg bg-white/10 px-2.5 py-2 text-right">
                                            <div className="flex items-center gap-1.5">
                                                <WeatherIcon className="h-4 w-4 text-cyan-200" />
                                                <p className="text-sm font-semibold text-white">
                                                    {weatherData ? `${Math.round(weatherData.temperature)}°C` : '--°C'}
                                                </p>
                                            </div>
                                            <p className="mt-1 text-[11px] text-white/75">{weatherMeta?.label || '天气加载中'}</p>
                                        </div>
                                    </div>
                                    <div className="relative mt-2 flex flex-wrap gap-2 text-[11px] text-white/80">
                                        <span className="rounded-full bg-white/10 px-2 py-1">{weatherData?.city || '定位中'}</span>
                                        <span className="rounded-full bg-white/10 px-2 py-1">风速 {weatherData ? `${Math.round(weatherData.windSpeed)} km/h` : '--'}</span>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-cyan-200/25 bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 p-3">
                                    <p className="text-sm text-white font-medium">空间分析实验室（GIS + WebGL）</p>
                                    <p className="mt-1 text-xs text-white/75 leading-relaxed">
                                        支持 GeoJSON/GML/Shapefile 导入、Turf.js 空间分析、MapLibre 可视化与 Three.js 3D 面挤出。
                                    </p>
                                    <button
                                        type="button"
                                        onClick={goGeoLab}
                                        className="mt-2 rounded-lg bg-cyan-500/25 px-3 py-1.5 text-xs text-cyan-100"
                                    >
                                        进入空间实验室
                                    </button>
                                </div>

                                {[
                                    { icon: User, label: '性别', value: authorData?.profile?.gender || '男' },
                                    { icon: Calendar, label: '年龄', value: authorData?.profile?.age || '24' },
                                    { icon: Phone, label: '联系电话', value: authorData?.profile?.phone || '13043428526' },
                                    { icon: GraduationCap, label: '学历', value: authorData?.profile?.education || '本科' },
                                    { icon: MapPin, label: '户籍', value: authorData?.profile?.location || '江西 · 汉族' },
                                    { icon: Target, label: '意向城市', value: authorData?.profile?.preferredCity || '全国' },
                                    { icon: Briefcase, label: '意向岗位', value: authorData?.profile?.preferredPosition || '前端开发师' },
                                    { icon: DollarSign, label: '期望薪资', value: authorData?.profile?.expectedSalary || '面议' },
                                ].map((item) => (
                                    <div key={item.label} className="rounded-xl bg-white/[0.10] p-3">
                                        <div className="flex items-center gap-2 text-white/80 text-sm">
                                            <item.icon className="w-4 h-4 text-purple-300" />
                                            {item.label}
                                        </div>
                                        <p className="mt-1 text-base text-white">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {mobileSection === 'skills' && (
                            <div className="space-y-2">
                                {(groupedSkills || []).map((skill) => (
                                    <div key={skill.category} className="rounded-xl bg-white/[0.10] p-3">
                                        <p className="text-base text-white font-medium">{skill.category}</p>
                                        <p className="mt-1 text-sm text-white/80">{skill.items.slice(0, 6).join(' / ')}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {mobileSection === 'experience' && (
                            <div className="space-y-2">
                                {(experienceData || []).map((exp) => (
                                    <div key={`${exp.company}-${exp.period}`} className="rounded-xl bg-white/[0.10] p-3">
                                        <p className="text-base text-white font-medium">{exp.project}</p>
                                        <p className="text-sm text-white/70 mt-1">{exp.company} · {exp.period}</p>
                                        <p className="text-sm text-white/85 mt-2 line-clamp-3">{exp.description}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {mobileSection === 'education' && educationData && (
                            <div className="rounded-xl bg-white/[0.10] p-3">
                                <p className="text-base text-white font-medium">{educationData.school}</p>
                                <p className="text-sm text-white/80 mt-1">{educationData.major} · {educationData.degree}</p>
                                <p className="text-sm text-white/70 mt-1">{educationData.startDate} - {educationData.endDate}</p>
                            </div>
                        )}

                        {mobileSection === 'honors' && (
                            <div className="space-y-2">
                                {(honorData || []).map((honor) => (
                                    <div key={honor.title} className="rounded-xl bg-white/[0.10] p-3 text-base text-white">
                                        {honor.title}
                                    </div>
                                ))}
                            </div>
                        )}

                        {mobileSection === 'contact' && (
                            <div className="space-y-3">
                                <a
                                    href={`tel:${authorData?.profile?.phone || '13043428526'}`}
                                    className="block rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 text-center text-base text-white"
                                >
                                    电话联系：{authorData?.profile?.phone || '13043428526'}
                                </a>
                                <div className="flex flex-wrap gap-2">
                                    {(authorData?.profile?.hobbies || selfEvaluation.slice(0, 4)).slice(0, 6).map((item) => (
                                        <span key={item} className="rounded-full bg-white/[0.14] px-2.5 py-1 text-xs text-white/90">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* About Section */}
            <section id="about" className={`relative ${isMobile ? 'hidden' : 'py-32'}`}>
                <div className={`container mx-auto ${isMobile ? 'px-4' : 'px-6'}`}>
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-4xl mx-auto"
                    >
                        <motion.h2
                            className="text-3xl sm:text-5xl text-white mb-8 sm:mb-16 text-center"
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

                        <div className={`grid md:grid-cols-2 ${isMobile ? 'gap-3' : 'gap-6'}`}>
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
                                    className={`bg-white/5 backdrop-blur-xl rounded-2xl ${isMobile ? 'p-4' : 'p-6'} border border-white/10 hover:border-purple-500/50 transition-all group cursor-pointer`}
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
            <section id="skills" className={`relative ${isMobile ? 'hidden' : 'py-32'} bg-white/5`}>
                <div className={`container mx-auto ${isMobile ? 'px-4' : 'px-6'}`}>
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6 }}
                    >
                        <motion.h2
                            className="text-3xl sm:text-5xl text-white mb-8 sm:mb-16 text-center"
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
            <section id="experience" className={`relative ${isMobile ? 'hidden' : 'py-32'}`}>
                <div className={`container mx-auto ${isMobile ? 'px-4' : 'px-6'}`}>
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6 }}
                    >
                        <motion.h2
                            className="text-3xl sm:text-5xl text-white mb-8 sm:mb-16 text-center"
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
            <section id="education" className={`relative ${isMobile ? 'hidden' : 'py-32'} bg-white/5`}>
                <div className={`container mx-auto ${isMobile ? 'px-4' : 'px-6'}`}>
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6 }}
                    >
                        <motion.h2
                            className="text-3xl sm:text-5xl text-white mb-8 sm:mb-16 text-center"
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
            <section id="honors" className={`relative ${isMobile ? 'hidden' : 'py-32'}`}>
                <div className={`container mx-auto ${isMobile ? 'px-4' : 'px-6'}`}>
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6 }}
                    >
                        <motion.h2
                            className="text-3xl sm:text-5xl text-white mb-8 sm:mb-16 text-center"
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
            <section id="contact" className={`relative ${isMobile ? 'hidden' : 'py-32'} bg-white/5`}>
                <div className={`container mx-auto ${isMobile ? 'px-4' : 'px-6'}`}>
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-4xl mx-auto text-center"
                    >
                        <motion.h2
                            className="text-3xl sm:text-5xl text-white mb-6 sm:mb-8"
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
                            className="text-white/70 text-sm sm:text-xl mb-8 sm:mb-12 leading-relaxed"
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
                                className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-base sm:text-xl cursor-pointer"
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

                        <div className="mt-8 sm:mt-12 pt-8 sm:pt-12 border-t border-white/10">
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
