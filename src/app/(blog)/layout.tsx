"use client";

import { useEffect } from "react";
import SiteNav from "@/components/SiteNav";

export default function BlogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // 与首页统一：深蓝黑底（防止页面回弹/越界时露出白底）
    useEffect(() => {
        const previous = document.body.style.backgroundColor;
        document.body.style.backgroundColor = "#f4f1ea";
        return () => {
            document.body.style.backgroundColor = previous;
        };
    }, []);

    return (
        <div className="site-theme site-shell min-h-screen">
            <SiteNav />
            <main className="site-main pt-24 pb-20 md:pb-0">
                {children}
            </main>
        </div>
    );
}
