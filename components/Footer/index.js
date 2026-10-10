import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import data from "../../data/portfolio.json";

const Footer = () => {
  const { email, socials, name } = data;
  const { pathname } = useRouter();

  return (
    <footer id="contact" aria-labelledby="contact-title" className="bg-ink px-4 pb-6 pt-16 text-bone fu-gutter tablet:pt-24">
      <div className="grid gap-x-4 gap-y-8 pb-16 laptop:grid-cols-4">
        <div className="flex flex-col gap-2">
          <h2 id="contact-title" className="fu-section-title">Contact</h2>
          <p className="font-mono text-[14px] text-bone/80">Available for freelance work, Amsterdam and remote</p>
        </div>
        <div className="flex flex-col gap-10 laptop:col-span-2">
          <a href={`mailto:${email}`} className="break-all text-[30px] font-semibold tracking-[-0.02em] underline decoration-olive decoration-4 underline-offset-8 hover:decoration-bone tablet:break-normal tablet:text-[48px] laptopl:text-[60px]">
            {email}
          </a>
          {pathname !== "/contact" && <Link href="/contact" className="inline-flex min-h-[44px] w-max items-center font-mono text-[14px] text-bone underline decoration-olive decoration-2 underline-offset-4 hover:decoration-bone">
            Or send a message →
          </Link>}
        </div>
        <ul className="flex flex-col gap-2 font-mono text-[14px]">
          {socials.map((social) => (
            <li key={social.id}>
              <a href={social.link} target="_blank" rel="noreferrer" className="inline-flex min-h-[32px] items-center hover:underline">
                {social.title} ↗
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-4 border-t border-bone/20 py-4">
        <Link href="/accessibility" className="inline-flex min-h-[32px] items-center font-mono text-[14px] underline underline-offset-4">
          Accessibility statement
        </Link>
      </div>
      <div className="flex justify-between border-t border-bone/20 pt-4 font-mono text-[14px] text-bone/80">
        <span>
          © {new Date().getFullYear()} {name}
        </span>
        <a href="#top" className="inline-flex min-h-[32px] items-center hover:text-bone">
          Back to top ↑
        </a>
      </div>
    </footer>
  );
};

export default Footer;
