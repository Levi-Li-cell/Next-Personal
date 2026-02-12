"use client";

import TopNavbar from '@/components/TopNavbar';

export default function BlogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-black">
            <TopNavbar />
            <main className="pt-20">
                {children}
            </main>
        </div>
    );
}
