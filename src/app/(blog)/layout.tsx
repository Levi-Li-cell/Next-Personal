"use client";

import TopNavbar from '@/components/TopNavbar';
import MobileBottomNav from '@/components/MobileBottomNav';

export default function BlogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-black">
            <TopNavbar />
            <main className="pt-20 pb-20 md:pb-0">
                {children}
            </main>
            <MobileBottomNav />
        </div>
    );
}
