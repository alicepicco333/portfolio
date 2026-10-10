import React from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Seo from "../components/Seo";

const NotFound = () => (
  <div className="min-h-screen bg-bone text-ink">
    <Seo title="Page not found | Alice Picco" description="This page does not exist. Find selected work, the CV and contact details on the home page." path="/404/" />
    <Header />
    <main id="main-content" tabIndex={-1} className="px-4 pb-32 pt-16 tablet:px-10">
      <p className="font-mono text-[14px] text-graphite">404</p>
      <h1 className="fu-display mt-2 max-w-[900px] text-[44px] tablet:text-phi3">This page is not on the map.</h1>
      <p className="mt-6 max-w-[640px] text-[19px] leading-relaxed">The link may be old, or a project may have moved. Try one of these instead:</p>
      <ul className="mt-6 flex flex-wrap gap-3">
        <li>
          <Link href="/#work" className="fu-btn fu-btn-primary">
            Selected work
          </Link>
        </li>
        <li>
          <Link href="/resume" className="fu-btn fu-btn-secondary">
            CV
          </Link>
        </li>
        <li>
          <Link href="/#contact" className="fu-btn fu-btn-secondary">
            Contact
          </Link>
        </li>
      </ul>
    </main>
    <Footer />
  </div>
);

export default NotFound;
