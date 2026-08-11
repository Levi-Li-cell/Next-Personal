"use client";

import SiteNav from "@/components/SiteNav";

export default function BlogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-black">
            <SiteNav />
            <main className="pt-24 pb-20 md:pb-0">
                {children}
            </main>
        </div>
    );
}