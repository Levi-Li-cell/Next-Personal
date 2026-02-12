"use client";

import { motion } from "motion/react";
import { User, Settings, Bell, Shield, CreditCard, Activity, Star } from "lucide-react";
import { useState } from "react";

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState("profile");

    const tabs = [
        { id: "profile", label: "个人资料", icon: User },
        { id: "settings", label: "账户设置", icon: Settings },
        { id: "notifications", label: "消息通知", icon: Bell },
        { id: "security", label: "安全中心", icon: Shield },
    ];

    return (
        <div className="min-h-screen bg-black text-white p-6 pt-24 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Dashboard Header / Top Navigation Bar for Personal Center */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-6">
                        个人中心
                    </h1>

                    {/* Custom Top Navigation Bar for Dashboard */}
                    <div className="flex flex-wrap gap-2 bg-white/5 backdrop-blur-md p-2 rounded-2xl border border-white/10">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    relative flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300
                                    ${activeTab === tab.id ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}
                                `}
                            >
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                                <tab.icon className="w-4 h-4 relative z-10" />
                                <span className="font-medium relative z-10">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Content Area */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    {/* Main Content Card */}
                    <div className="md:col-span-2 space-y-6">
                        {/* User Info Card */}
                        <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="flex items-center gap-6">
                                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 p-[2px]">
                                    <div className="h-full w-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                        <User className="h-10 w-10 text-white/50" />
                                        {/* Integration Point: User Avatar Image */}
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">欢迎回来</h2>
                                    <p className="text-white/60">普通用户 (Lv.1)</p>
                                    <div className="mt-4 flex gap-3">
                                        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors border border-white/5">
                                            编辑资料
                                        </button>
                                        <button className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 border border-purple-500/30 rounded-lg text-sm transition-all">
                                            升级会员
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity / Content Placeholder */}
                        <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:min-h-[400px]">
                            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-cyan-400" />
                                动态概览
                            </h3>
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-4">
                                            <Star className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">完成了新的项目里程碑</p>
                                            <p className="text-white/40 text-sm">2小时前</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 flex items-center justify-center h-40 border-2 border-dashed border-white/10 rounded-xl">
                                <p className="text-white/30">暂无更多后端数据</p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Stats */}
                    <div className="space-y-6">
                        <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
                            <h3 className="text-lg font-medium text-white mb-6">账户余额</h3>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-3xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">0.00</span>
                                <span className="text-white/60">CNY</span>
                            </div>
                            <div className="w-full bg-white/10 h-2 rounded-full mb-4">
                                <div className="w-[10%] bg-gradient-to-r from-green-400 to-cyan-400 h-full rounded-full" />
                            </div>
                            <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                充值
                            </button>
                        </div>

                        <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
                            <h3 className="text-lg font-medium text-white mb-6">会员特权</h3>
                            <ul className="space-y-3">
                                {['无广告浏览', '专属徽章', '优先客服支持', '更多云存储空间'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-white/70 text-sm">
                                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
