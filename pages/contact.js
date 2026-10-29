import React from "react";
import Seo from "../components/Seo";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ContactForm from "../components/ContactForm";
import data from "../data/portfolio.json";

const Contact = () => (
  <div className="min-h-screen bg-bone text-ink">
    <Seo title="Contact | Alice Picco" description="Write to Alice Picco, HCI researcher and designer in Amsterdam, available for freelance work." path="/contact/" />
    <Header />
    <main id="main-content" tabIndex={-1} className="grid gap-x-4 gap-y-10 px-4 pb-24 pt-10 fu-gutter laptop:grid-cols-4 laptop:pt-16">
      <div className="flex flex-col gap-4">
        <h1 className="fu-section-title">Contact</h1>
        <p className="font-mono text-[14px] leading-relaxed text-graphite">Available for freelance work, Amsterdam and remote</p>
      </div>
      <div className="flex max-w-[760px] flex-col gap-10 laptop:col-span-3">
        <p className="text-[24px] font-medium leading-snug tracking-[-0.01em] tablet:text-[28px]">
          Tell me about the project, the people it is for and what you need. I usually reply within a few days.
        </p>
        <ContactForm email={data.email} />
        <p className="border-t border-ink pt-5 text-[18px]">
          Prefer email?{" "}
          <a href={`mailto:${data.email}`} className="font-semibold underline decoration-olive decoration-2 underline-offset-4">
            {data.email}
          </a>
        </p>
      </div>
    </main>
    <Footer />
  </div>
);

export default Contact;
