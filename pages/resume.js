import React from "react";
import Seo from "../components/Seo";
import Header from "../components/Header";
import Footer from "../components/Footer";
import data from "../data/portfolio.json";
import { withBase } from "../utils";

export async function getStaticProps() {
  if (!data.showResume) return { notFound: true };
  return { props: {} };
}

const Section = ({ label, children }) => (
  <section className="grid gap-x-4 gap-y-6 border-t border-ink pb-16 pt-4 print:gap-y-2 print:pb-6 laptop:grid-cols-4">
    <h2 className="fu-title text-phi1">
      {label}
    </h2>
    <div className="laptop:col-span-3">{children}</div>
  </section>
);

const Resume = () => {
  const { resume, name, socials, email } = data;

  return (
    <div className="min-h-screen bg-bone text-ink">
      <Seo title={`CV | ${name}`} description={resume.description || resume.tagline} path="/resume/" />

      <Header />

      <main id="main-content" tabIndex={-1} className="px-4 tablet:px-10">
        {/* on paper (and in the PDF) the page opens with name and contact details instead of the site header */}
        <div className="hidden print:block">
          <p className="fu-display text-[40px]">{name}</p>
          <p className="mt-2 font-mono text-[12px] text-graphite">
            {[email, "alicepicco333.github.io/portfolio", "linkedin.com/in/alice-picco-791157114", "github.com/alicepicco333"].map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
        </div>
        <div className="grid gap-x-4 gap-y-8 pb-16 pt-6 print:!pb-6 print:!pt-4 laptop:grid-cols-4 laptop:pb-[110px] laptop:pt-10">
          <h1 className="fu-display text-[48px] print:hidden tablet:text-phi3">CV</h1>
          <div className="flex max-w-[720px] flex-col gap-5 laptop:col-span-3">
            <p className="fu-meta text-fieldgrey">{resume.tagline}</p>
            <p className="text-lg leading-relaxed">{resume.description}</p>
            <div className="flex flex-wrap gap-2 print:hidden">
              <a href={withBase("/alice-picco-cv.pdf")} download className="fu-btn fu-btn-primary">
                Download CV (PDF) ↓
              </a>
              <a href={`mailto:${email}`} className="fu-btn fu-btn-secondary">
                {email}
              </a>
              {socials.map((social) => (
                <a key={social.id} href={social.link} target="_blank" rel="noreferrer" className="fu-btn fu-btn-secondary">
                  {social.title} ↗
                </a>
              ))}
            </div>
          </div>
        </div>

        <Section label="Experience">
          <ol>
            {resume.experiences.map((exp) => (
              <li key={exp.id} className="grid break-inside-avoid gap-1 py-5 print:py-3 tablet:grid-cols-[200px_1fr_130px] tablet:gap-4">
                <span className="fu-meta text-fieldgrey">{exp.dates}</span>
                <span className="flex flex-col gap-1">
                  <span className="text-lg font-semibold">{exp.position}</span>
                  <span className="text-[16px] leading-snug text-graphite">{exp.bullets}</span>
                </span>
                <span className="fu-meta text-graphite tablet:text-right">{exp.type}</span>
              </li>
            ))}
          </ol>
        </Section>

        {resume.skills?.length > 0 && (
          <Section label="Skills">
            <dl>
              {resume.skills.map((row) => (
                <div key={row.id} className="grid break-inside-avoid gap-1 py-4 print:py-2 tablet:grid-cols-[200px_1fr] tablet:gap-4">
                  <dt className="fu-meta text-fieldgrey">{row.group}</dt>
                  <dd className="text-[18px] leading-snug">{row.items.join(", ")}</dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        <Section label="Education">
          <ol>
            {resume.educationList.map((edu) => (
              <li key={edu.id} className="grid break-inside-avoid gap-1 py-5 print:py-3 tablet:grid-cols-[200px_1fr] tablet:gap-4">
                <span className="fu-meta text-fieldgrey">{edu.dates}</span>
                <span className="flex flex-col gap-1">
                  <span className="text-lg font-semibold">{edu.name}</span>
                  <span className="text-[16px] text-graphite">{edu.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </Section>

        {resume.certifications?.length > 0 && (
          <Section label="Certifications">
            <ol>
              {resume.certifications.map((c) => (
                <li key={c.id} className="grid break-inside-avoid gap-1 py-4 print:py-2 tablet:grid-cols-[200px_1fr_220px] tablet:gap-4">
                  <span className="fu-meta text-fieldgrey">{c.date}</span>
                  <span className="text-[18px] font-semibold leading-snug">{c.name}</span>
                  <span className="fu-meta text-graphite tablet:text-right">{c.issuer}</span>
                </li>
              ))}
            </ol>
          </Section>
        )}

      </main>

      <Footer />
    </div>
  );
};

export default Resume;
