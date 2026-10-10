import React from "react";
import Seo from "../components/Seo";
import Header from "../components/Header";
import Footer from "../components/Footer";
import A11yControls from "../components/A11yControls";
import data from "../data/portfolio.json";

const Accessibility = () => (
  <div className="min-h-screen bg-bone text-ink">
    <Seo
      title="Accessibility statement | Alice Picco"
      description="How this portfolio aims to meet WCAG 2.1 AA, and the controls it offers for motion and contrast."
      path="/accessibility/"
    />
    <Header />
    <main id="main-content" tabIndex={-1} className="px-4 pb-24 pt-10 tablet:px-10">
      <article className="max-w-[760px]">
        <h1 className="fu-display text-[44px] tablet:text-phi3">Accessibility statement</h1>
        <p className="mt-6 text-[19px] leading-relaxed">
          This site aims to meet the Web Content Accessibility Guidelines (WCAG) 2.1 at level AA. As an HCI researcher, I treat
          accessibility as part of the design, not a check at the end.
        </p>

        <section aria-labelledby="a11y-controls" className="mt-12 border-t border-ink pt-5">
          <h2 id="a11y-controls" className="text-[28px] font-semibold tracking-[-0.02em]">
            Your settings
          </h2>
          <p className="mt-3 text-[18px] leading-relaxed">
            Both settings are also in the navigation bar of every page (in the menu on phones). They are saved on this device only.
          </p>
          <A11yControls className="mt-4" />
          <ul className="mt-5 list-disc space-y-2 pl-5 text-[18px] leading-relaxed">
            <li>
              <strong>Motion</strong> turns off the map&rsquo;s entrance, the glow, card transitions and the looping previews.
              It is off by default if your device asks for reduced motion.
            </li>
            <li>
              <strong>High contrast</strong> switches the accent color to a dark gray on every page, turns all secondary text and outlines black, and removes glows and transparency. The page background stays the same.
            </li>
          </ul>
        </section>

        <section aria-labelledby="a11y-measures" className="mt-12 border-t border-ink pt-5">
          <h2 id="a11y-measures" className="text-[28px] font-semibold tracking-[-0.02em]">
            What the site does
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[18px] leading-relaxed">
            <li>Body text and labels reach a contrast ratio of at least 4.5:1; large headings at least 3:1.</li>
            <li>A &ldquo;Skip to main content&rdquo; link is the first thing you reach with the keyboard.</li>
            <li>Every interactive element, including the nodes of the skill map and the work wheel, can be reached and used with the keyboard, with a visible focus ring.</li>
            <li>Each page has one main heading and a consistent heading order, inside header, main, navigation and footer landmarks.</li>
            <li>Buttons and toggles have text labels and announce their state; images have text alternatives.</li>
            <li>The skill map and the work charts also exist as plain text: the skill card, the project grid and every project page.</li>
            <li>Buttons and controls are at least 44 pixels tall; every other link or target is at least 24 by 24 pixels, or sits inline in a sentence.</li>
            <li>Two keyboard shortcuts work only while focus is inside their section: in the skill map, keys 1 to 5 jump to listen, order, count, shape and play; in Selected work, I and W switch between the index and the wheel.</li>
          </ul>
        </section>

        <section aria-labelledby="a11y-limits" className="mt-12 border-t border-ink pt-5">
          <h2 id="a11y-limits" className="text-[28px] font-semibold tracking-[-0.02em]">
            Known limits
          </h2>
          <p className="mt-4 text-[18px] leading-relaxed">
            Some project screenshots show interfaces with small text; the same information is written out on each project page.
            The wheel view is shown on large screens only; smaller screens get the project grid.
          </p>
        </section>

        <section aria-labelledby="a11y-contact" className="mt-12 border-t border-ink pt-5">
          <h2 id="a11y-contact" className="text-[28px] font-semibold tracking-[-0.02em]">
            Something not working?
          </h2>
          <p className="mt-4 text-[18px] leading-relaxed">
            Please tell me at{" "}
            <a href={`mailto:${data.email}`} className="font-semibold text-olive underline underline-offset-2">
              {data.email}
            </a>
            . I&rsquo;ll fix it.
          </p>
          <p className="mt-6 font-mono text-[14px] text-graphite">Last reviewed September 2026.</p>
        </section>
      </article>
    </main>
    <Footer />
  </div>
);

export default Accessibility;
