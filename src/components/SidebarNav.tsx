"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, useSpring, useScroll } from 'motion/react';

interface Section {
    id: string;
    label: string;
}

const sections: Section[] = [
    { id: 'hero', label: '首页' },
    { id: 'about', label: '关于我' },
    { id: 'skills', label: '技能' },
    { id: 'experience', label: '经历' },
    { id: 'education', label: '教育' },
    { id: 'honors', label: '荣誉' },
    { id: 'contact', label: '联系' }
];

export default function SidebarNav() {
    const [activeSection, setActiveSection] = useState('hero');
    const { scrollYProgress } = useScroll();
    const scaleY = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const isScrolling = useRef(false);

    useEffect(() => {
        const handleScroll = () => {
            if (isScrolling.current) return;

            const scrollPosition = window.scrollY + window.innerHeight / 2.5;

            for (let i = sections.length - 1; i >= 0; i--) {
                const element = document.getElementById(sections[i].id);
                if (element && element.offsetTop <= scrollPosition) {
                    setActiveSection(sections[i].id);
                    break;
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        isScrolling.current = true;
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => {
                isScrolling.current = false;
            }, 1000);
        }
    };

    return (
        <motion.aside
            className="fixed left-8 top-1/2 -translate-y-1/2 z-40 hidden lg:block"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
        >
            {/* Glass Container */}
            <div className="relative p-2 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/5 shadow-2xl">
                {/* Vertical Progress Line Track - positioned to align with dot centers */}
                <div className="absolute left-[18px] top-[24px] bottom-[24px] w-[2px] bg-white/5 rounded-full overflow-hidden">
                    {/* Filled Progress */}
                    <motion.div
                        className="absolute top-0 left-0 right-0 bg-gradient-to-b from-purple-500 via-pink-500 to-cyan-500 origin-top"
                        style={{ height: '100%', scaleY }}
                    />
                </div>

                <div className="relative flex flex-col gap-6">
                    {sections.map((section, index) => {
                        const isActive = activeSection === section.id;
                        return (
                            <motion.button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className="group relative flex items-center pl-2 pr-4 py-2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + index * 0.1 }}
                            >
                                {/* Hover Background */}
                                <motion.div
                                    className="absolute inset-0 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                />

                                {/* Dot Indicator - simple circle, same for active and inactive */}
                                <div className="relative z-10 flex items-center justify-center w-8 h-8 mr-4">
                                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isActive
                                            ? 'bg-gradient-to-br from-purple-400 to-cyan-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]'
                                            : 'bg-white/20 border border-white/10 group-hover:bg-white/50 group-hover:border-white/30'
                                        }`} />
                                </div>

                                {/* Text Label */}
                                <div className="flex flex-col items-start relative z-10">
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-[10px] font-mono tracking-widest transition-colors duration-300 ${isActive ? 'text-purple-400' : 'text-white/20'}`}>
                                            0{index + 1}
                                        </span>
                                        <span
                                            className={`text-sm font-medium tracking-wide transition-all duration-300 ${isActive
                                                ? 'text-white translate-x-1 shadow-black drop-shadow-lg'
                                                : 'text-white/40 group-hover:text-white/70'
                                                }`}
                                        >
                                            {section.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Active Indicator Line (Right side accents) */}
                                {isActive && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: '60%', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 w-[2px] bg-gradient-to-b from-transparent via-cyan-400 to-transparent rounded-full"
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </motion.aside>
    );
}
