"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import SplitText from "@/components/SplitText";
import { useSession } from "@/lib/auth/client";
import styles from "./CardNav.module.css";

export type CardNavLink = {
  label: string;
  href?: string;
  onClick?: () => void;
};

export type CardNavItem = {
  label: string;
  /** 支持颜色或渐变，例如 linear-gradient(...) */
  bgColor: string;
  textColor: string;
  links: CardNavLink[];
};

type CardNavProps = {
  items: CardNavItem[];
  ctaLabel: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  brandHref?: string;
  loginHref?: string;
  adminHref?: string;
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.4 6.1 29.5 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.4 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C36.9 40.2 44 35 44 24c0-1.3-.1-2.6-.4-3.9z"
      />
    </svg>
  );
}

export default function CardNav({
  items,
  ctaLabel,
  ctaHref,
  onCtaClick,
  brandHref = "/liwei",
  loginHref = "/signin",
  adminHref = "/admin",
}: CardNavProps) {
  const [expanded, setExpanded] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const { data: session, isPending: sessionLoading } = useSession();

  useLayoutEffect(() => {
    const nav = navRef.current;
    const cards = cardRefs.current.filter((card): card is HTMLElement => Boolean(card));
    if (!nav) return;

    const context = gsap.context(() => {
      gsap.set(nav, { height: 64 });
      gsap.set(cards, { y: 26, opacity: 0 });
      timelineRef.current = gsap.timeline({ paused: true })
        .to(nav, { height: "auto", duration: 0.42, ease: "power3.out" })
        .to(cards, { y: 0, opacity: 1, duration: 0.38, stagger: 0.08, ease: "power3.out" }, "-=0.18");
    }, nav);

    return () => {
      timelineRef.current?.kill();
      context.revert();
    };
  }, [items]);

  const toggle = () => {
    const timeline = timelineRef.current;
    if (!timeline) return;
    if (expanded) {
      timeline.eventCallback("onReverseComplete", () => setExpanded(false));
      timeline.reverse();
    } else {
      setExpanded(true);
      timeline.play(0);
    }
  };

  const close = () => {
    if (!expanded) return;
    timelineRef.current?.reverse();
    setExpanded(false);
  };

  const cta = ctaHref ? (
    <Link className={styles.cta} href={ctaHref} onClick={close}>{ctaLabel}</Link>
  ) : (
    <button className={styles.cta} type="button" onClick={() => { onCtaClick?.(); close(); }}>{ctaLabel}</button>
  );

  const account = sessionLoading ? null : session?.user ? (
    <Link className={styles.account} href={adminHref} onClick={close} title={session.user.name || "后台管理"}>
      <span className={styles.avatar}>{(session.user.name || session.user.email || "A").slice(0, 1).toUpperCase()}</span>
      <span className={styles.accountLabel}>后台</span>
    </Link>
  ) : (
    <Link className={styles.account} href={loginHref} onClick={close} title="登录">
      <GoogleIcon className={styles.googleIcon} />
      <span className={styles.accountLabel}>登录</span>
    </Link>
  );

  return (
    <div className={styles.container}>
      <nav ref={navRef} className={`${styles.nav} ${expanded ? styles.open : ""}`} aria-label="主导航">
        <div className={styles.topbar}>
          <button className={`${styles.menu} ${expanded ? styles.menuOpen : ""}`} type="button" onClick={toggle} aria-label={expanded ? "关闭导航" : "打开导航"} aria-expanded={expanded}>
            <span /><span />
          </button>
          <Link href={brandHref} className={styles.brand} onClick={close} aria-label="李伟主页">
            <SplitText text="李伟" tag="span" splitType="chars" delay={55} duration={0.7} from={{ opacity: 0, y: 12 }} to={{ opacity: 1, y: 0 }} onLetterAnimationComplete={() => {}} />
            <span>PORTFOLIO</span>
          </Link>
          <div className={styles.actions}>
            {account}
            {cta}
          </div>
        </div>
        <div className={styles.content} aria-hidden={!expanded}>
          {items.slice(0, 3).map((item, index) => (
            <section key={item.label} ref={(element) => { cardRefs.current[index] = element; }} className={styles.card} style={{ background: item.bgColor, color: item.textColor }}>
              <h2>{item.label}</h2>
              <div className={styles.links}>
                {item.links.map((link) => link.href ? (
                  <Link key={link.label} href={link.href} onClick={close}><ArrowUpRight aria-hidden="true" />{link.label}</Link>
                ) : (
                  <button key={link.label} type="button" onClick={() => { link.onClick?.(); close(); }}><ArrowUpRight aria-hidden="true" />{link.label}</button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </nav>
    </div>
  );
}
