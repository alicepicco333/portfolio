import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import data from "../../data/portfolio.json";
import GraphMark from "../GraphMark";
import A11yControls from "../A11yControls";
import { useActiveSection } from "../../utils";

// Sections of the home page in page order (the logo already leads to the top); the nav follows the one on screen.
export const SECTIONS = [
  { id: "work", label: "work" },
  { id: "about", label: "about" },
  { id: "journey", label: "timeline" },
  { id: "contact", label: "contact", href: "/contact" },
];

const Header = () => {
  const [open, setOpen] = useState(false);
  const { email, name } = data;
  const { pathname } = useRouter();
  const onHome = pathname === "/";
  const { active } = useActiveSection(onHome ? ["map", "work", "in-progress", "about", "journey", "contact"] : []);
  const current = (id) => (id === "contact" && pathname === "/contact") || (onHome && id !== "contact" && (active === id || (id === "work" && active === "in-progress")));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-ink bg-bone text-ink">
      <div className="flex h-16 items-center gap-6 px-4 fu-gutter">
        <Link href="/" className="-m-2 flex items-center gap-3 p-2" aria-label={`${name}, home`}>
          <GraphMark size={34} />
          <span className="text-[18px] font-semibold lowercase tracking-[-0.01em]" aria-hidden="true">
            {name}
          </span>
        </Link>

        {/* navigation first, the CV, then the display settings at the edge */}
        <nav className="ml-auto hidden h-full items-center gap-5 text-[16px] tablet:flex laptop:gap-8" aria-label="Main">
          {SECTIONS.map((s) => {
            const on = current(s.id);
            return (
              <Link
                key={s.id}
                href={s.href || `/#${s.id}`}
                aria-current={on ? (s.href ? "page" : "location") : undefined}
                className={`py-1 underline-offset-[7px] transition-colors duration-150 hover:text-olive ${on ? "underline decoration-2" : ""}`}
              >
                {s.label}
              </Link>
            );
          })}
          <Link href="/resume" className={`flex min-h-[44px] items-center px-4 text-white ${pathname === "/resume" ? "bg-ink" : "bg-olive hover:bg-ink"}`}>
            cv
          </Link>
        </nav>
        <A11yControls compact className="hidden flex-nowrap gap-0 border-l border-ink/20 pl-2 tablet:flex laptop:gap-2 laptop:pl-4" />

        <button
          type="button"
          className="ml-auto flex min-h-[44px] items-center px-2 font-mono text-[14px] tablet:hidden"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "close" : "menu"}
        </button>
      </div>

      {open && (
        <nav id="mobile-menu" className="border-t border-ink bg-bone px-4 pb-6 tablet:hidden" aria-label="Mobile">
          {SECTIONS.map((s) => (
            <Link key={s.id} href={s.href || `/#${s.id}`} onClick={() => setOpen(false)} className="block border-b border-ink/20 py-4 text-[32px] font-semibold tracking-[-0.02em]">
              {s.label}
            </Link>
          ))}
          <Link href="/resume" onClick={() => setOpen(false)} className="block border-b border-ink/20 py-4 text-[32px] font-semibold tracking-[-0.02em]">
            cv
          </Link>
          <A11yControls className="pt-5" />
          <a href={`mailto:${email}`} className="block pt-5 text-[16px] text-olive underline">
            {email}
          </a>
        </nav>
      )}
    </header>
  );
};

export default Header;
