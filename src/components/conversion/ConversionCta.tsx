import Link from "next/link";
import { ArrowRight } from "lucide-react";

type ConversionCtaProps = {
  eyebrow: string;
  title: string;
  description: string;
};

const targets = [
  {
    href: "/author#contact",
    title: "面试邀约",
    description: "在作者页联系区直接提交岗位信息和沟通方式。",
  },
  {
    href: "/author#contact",
    title: "合作需求",
    description: "在作者页联系区直接提交项目类型、预算和周期。",
  },
];

export function ConversionCta({ eyebrow, title, description }: ConversionCtaProps) {
  return (
    <section className="mt-16 rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(243,201,106,0.18),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] md:p-8">
      <div className="mb-6 max-w-2xl">
        <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[#f3c96a]">{eyebrow}</p>
        <h2 className="text-2xl font-semibold text-white md:text-3xl">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-white/68">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {targets.map((target) => (
          <Link
            key={`${target.href}-${target.title}`}
            href={target.href}
            className="group rounded-[1.5rem] border border-white/8 bg-black/18 p-5 transition-transform duration-200 hover:-translate-y-1 hover:border-[#f3c96a]/40"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">{target.title}</h3>
              <ArrowRight className="h-4 w-4 text-[#f3c96a] transition-transform duration-200 group-hover:translate-x-1" />
            </div>
            <p className="text-sm leading-6 text-white/60">{target.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
