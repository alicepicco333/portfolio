  // ...existing code...

import React, { useLayoutEffect, useRef, useState } from "react";
import Head from "next/head";
import Header from "../components/Header";
import Socials from "../components/Socials";
import Footer from "../components/Footer";
import Link from "next/link";
import { useRouter } from "next/router";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import portfolioData from "../data/portfolio.json";
import WorkCard from "../components/WorkCard";
import HeroGraph from "../components/HeroGraph";
import ScrambleText from "../components/ScrambleText";

const scrollWithOffset = (el, offset = -80) => {
  const y = el.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top: y, behavior: "smooth" });
};

const projectCategories = [...new Set(portfolioData.projects.map((project) => project.category))];

const Home = () => {
  const workRef = useRef(null);
  const cardsContainerRef = useRef(null);
  const headerRefs = useRef([]);
  const projectCardRefs = useRef([]);
  const router = useRouter();
  const [activeCategories, setActiveCategories] = useState(projectCategories);
  const [heroHovered, setHeroHovered] = useState(false);

  const cardPalettes = [
    { surface: "#A8C69F", accent: "#F5EFE6" },
    { surface: "#FFC1CF", accent: "#D9D7D2" },
    { surface: "#D9D7D2", accent: "#A8C69F" },
    { surface: "#F5EFE6", accent: "#FFC1CF" },
  ];

  const handleWorkScroll = () => {
    if (workRef.current) scrollWithOffset(workRef.current);
  };

  const handleAboutScroll = () => {
    const about = document.getElementById("about-section");
    if (about) scrollWithOffset(about);
  };

  const toggleCategory = (category) => {
    setActiveCategories((previousCategories) => {
      if (previousCategories.includes(category)) {
        return previousCategories.filter((item) => item !== category);
      }

      return [...previousCategories, category];
    });
  };

  const filteredProjects = portfolioData.projects.filter((project) => {
    if (activeCategories.length === 0) return true;
    return activeCategories.includes(project.category);
  });

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.from(headerRefs.current, {
        opacity: 0,
        y: 40,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
      });

      const cards = projectCardRefs.current.filter(Boolean);

      cards.forEach((card, index) => {
        gsap.set(card, {
          opacity: 0,
          y: 72,
          scale: 0.98,
          rotate: index % 2 === 0 ? -0.8 : 0.8,
        });

        ScrollTrigger.create({
          trigger: card.parentElement,
          start: "top 82%",
          once: true,
          onEnter: () => {
            gsap.to(card, {
              opacity: 1,
              y: 0,
              scale: 1,
              rotate: 0,
              duration: 0.7,
              ease: "power3.out",
            });
          },
        });
      });
    }, workRef);

    return () => ctx.revert();
  }, [router.asPath, activeCategories]);

  useLayoutEffect(() => {
    projectCardRefs.current = projectCardRefs.current.slice(0, filteredProjects.length);
  }, [filteredProjects.length]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const cards = projectCardRefs.current.filter(Boolean);

      if (!cards.length) return;

      gsap.fromTo(
        cards,
        {
          autoAlpha: 0,
          y: 28,
          scale: 0.985,
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.45,
          stagger: 0.08,
          ease: "power2.out",
          overwrite: true,
          onComplete: () => ScrollTrigger.refresh(),
        }
      );
    }, cardsContainerRef);

    return () => ctx.revert();
  }, [filteredProjects]);

  return (
    <div className={`relative min-h-screen overflow-x-hidden ${portfolioData.showCursor ? "cursor-" : ""}`}>
      <Head>
        <title>Alice Picco</title>
        <meta name="description" content="Portfolio website of Alice Picco" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header handleWorkScroll={handleWorkScroll} handleAboutScroll={handleAboutScroll} />

      <main className="px-6 py-16 mx-auto max-w-7xl">
        <section 
          className="mb-16 text-center relative min-h-[650px]"
          onMouseEnter={() => setHeroHovered(true)}
          onMouseLeave={() => setHeroHovered(false)}
        >
          <HeroGraph hovered={heroHovered} />
          <div 
            className={`relative transition-all duration-300 ${heroHovered ? 'blur-sm z-0' : 'z-10'}`}
          >
            <h1
              ref={(el) => (headerRefs.current[0] = el)}
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-5"
            >
              {portfolioData.headerTaglineOne}
            </h1>
            <h1
              ref={(el) => (headerRefs.current[1] = el)}
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-5"
            >
              I&apos;m <ScrambleText text="Alice" delay={400} />,
            </h1>
            <h1
              ref={(el) => (headerRefs.current[2] = el)}
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-5"
            >
              {portfolioData.headerTaglineThree}
            </h1>
            <h1
              ref={(el) => (headerRefs.current[3] = el)}
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-5"
            >
              based in <ScrambleText text="Amsterdam" delay={800} />.
            </h1>
            <p className="text-md mt-8 text-[#2B2118]/75 dark:text-gray-300">{portfolioData.email}</p>
          </div>
          <div className="mt-[7.5rem] relative z-20">
            <Socials />
          </div>
        </section>

        <section ref={workRef} className="mb-24 mt-16">
          <div className="mx-auto max-w-5xl px-2">
            <div className="rounded-[2rem] border border-[#2B2118] bg-[#F5EFE6] px-6 py-5 text-center">
              <h2 className="text-2xl font-semibold">Work</h2>
              <p className="mt-3 text-base text-[#2B2118]/75 sm:text-lg">
                A stacked selection of projects. Combine the switches to filter multiple categories at the same time.
              </p>

              <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
                {projectCategories.map((category, index) => {
                  const isActive = activeCategories.includes(category);
                  const toggleId = `category-toggle-${index}`;

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-[#2B2118] px-4 py-4 text-left transition-colors duration-300"
                      style={{
                        backgroundColor: isActive ? "#FFC1CF" : "#D9D7D2",
                      }}
                      aria-pressed={isActive}
                      aria-label={`${category} filter ${isActive ? "on" : "off"}`}
                    >
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2B2118]/65">
                          {isActive ? "On" : "Off"} switch
                        </p>
                        <p className="mt-1 text-base font-bold text-[#2B2118] sm:text-lg">
                          {category}
                        </p>
                      </div>

                      <span
                        id={toggleId}
                        className="relative inline-flex h-8 w-16 flex-shrink-0 rounded-full border border-[#2B2118] transition-colors duration-300"
                        style={{
                          backgroundColor: isActive ? "#A8C69F" : "#F5EFE6",
                        }}
                      >
                        <span
                          className={`absolute top-1 h-6 w-6 rounded-full border border-[#2B2118] bg-[#F5EFE6] transition-all duration-300 ${isActive ? "left-9" : "left-1"}`}
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div ref={cardsContainerRef} className="mt-10">
            {filteredProjects.map((project, index) => {
              const palette = cardPalettes[index % cardPalettes.length];

              return (
                <div
                  key={project.id}
                  className="sticky top-32 flex h-screen items-center justify-center py-6"
                  style={{ zIndex: index + 1 }}
                >
                  <Link href={`/projects/${project.id}`} className="block w-full">
                    <div
                      ref={(element) => {
                        projectCardRefs.current[index] = element;
                      }}
                      className="mx-auto w-full max-w-6xl"
                    >
                      <WorkCard
                        img={project.imageSrc || project.highlightImage}
                        name={project.title}
                        description={project.description}
                        tags={project.tags}
                        category={project.category}
                        cardNumber={String(index + 1).padStart(2, "0")}
                        surfaceColor={palette.surface}
                        accentColor={palette.accent}
                      />
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        <section id="about-section" className="mb-20">
          <h2 className="text-2xl font-semibold text-center">About</h2>
          <p className="mt-4 text-lg text-justify text-[#2B2118]/85 dark:text-gray-300">{portfolioData.aboutpara}</p>
        </section>

        <p className="text-center text-lg text-[#2B2118]/75 dark:text-gray-300 mt-10">{portfolioData.email}</p>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
