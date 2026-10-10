import React from "react";
import Head from "next/head";
import Seo from "../components/Seo";
import Link from "next/link";
import { gsap } from "gsap";
import { motionOn } from "../utils/motion";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SkillMap from "../components/SkillMap";
import WorkExplorer from "../components/WorkExplorer";
import InProgress from "../components/InProgress";
import Journey from "../components/Journey";
import portfolioData from "../data/portfolio.json";
import { useIsomorphicLayoutEffect, byDateDesc } from "../utils";

// Finished work is shown in the work views; work in progress gets its own section.
const FINISHED = ["Design", "Research", "Live Coding"];

const Home = () => {
  const { about } = portfolioData;
  const projects = [...portfolioData.projects].sort(byDateDesc);
  const finished = projects.filter((p) => FINISHED.includes(p.category));
  const wip = projects.filter((p) => p.category === "Work in Progress");


  useIsomorphicLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      if (!motionOn()) return;
      gsap.utils.toArray(".fu-reveal").forEach((el) => {
        if (el.querySelector(".fu-section-title") || el.classList.contains("fu-section-title")) return;
        gsap.from(el, { opacity: 0, y: 24, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
      });
      // the big section titles rise out of their own baseline as the section arrives
      gsap.utils.toArray(".fu-section-title").forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: "inset(0 0 100% 0)", y: "0.35em" },
          { clipPath: "inset(0 0 -20% 0)", y: 0, duration: 0.9, ease: "expo.out", clearProps: "clipPath,transform", scrollTrigger: { trigger: el, start: "top 90%", once: true } }
        );
      });

    });
    // the map, the work views and images change the page height after load: keep triggers in step
    let timer;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => ScrollTrigger.refresh(), 150);
    });
    observer.observe(document.body);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
      mm.revert();
    };
  }, []);

  return (
    <div id="top" className="min-h-screen bg-bone text-ink">
      <Seo title="Alice Picco, HCI researcher & designer" description={about.lead} />
      <Head>
        <meta name="theme-color" content="#D5D6DB" />
      </Head>

      <Header />

      <main id="main-content" tabIndex={-1}>
        <h1 className="sr-only">Alice Picco, HCI researcher and designer</h1>
        <SkillMap projects={finished} />
        <WorkExplorer projects={finished} />
        <InProgress projects={wip} />

        <section id="about" aria-labelledby="about-title" className="scroll-mt-16 bg-olive px-4 py-16 text-white fu-gutter tablet:py-24">
          <div className="grid gap-x-8 gap-y-10 laptop:grid-cols-4">
            <h2 id="about-title" className="fu-reveal fu-section-title">About</h2>
            <div className="flex flex-col gap-10 laptop:col-span-3">
              <p className="fu-reveal max-w-[980px] text-[28px] font-medium leading-[1.2] tracking-[-0.01em] tablet:text-phi2">{about.lead}</p>
              <div className="fu-reveal grid max-w-[980px] gap-6 text-[18px] leading-relaxed tablet:grid-cols-2">
                {about.paragraphs.map((text) => (
                  <p key={text.slice(0, 20)}>{text}</p>
                ))}
              </div>
              <div className="fu-reveal grid max-w-[980px] gap-6 tablet:grid-cols-3" role="group" aria-label="How I work">
                {about.practice.map((p) => (
                  <div key={p.title} className="flex flex-col gap-2">
                    <span className="font-mono text-[14px] uppercase tracking-[0.12em]">{p.title}</span>
                    <span className="text-[18px] leading-snug">{p.items}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <Journey projects={projects.filter((p) => FINISHED.includes(p.category) || p.category === "Work in Progress")} />
      </main>

      <Footer />
    </div>
  );
};

export default Home;
