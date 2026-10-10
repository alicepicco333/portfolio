import React from "react";
import Head from "next/head";

// Title, description and link-preview tags (Open Graph, Twitter) for a page.
// Previews need absolute URLs, so they point at the published site.
export const SITE = "https://alicepicco333.github.io/portfolio";

// search results show about 155 characters: cut longer descriptions at a word
const trim = (t = "") => (t.length <= 155 ? t : `${t.slice(0, 152).replace(/\s+\S*$/, "")}...`);

const Seo = ({ title, description: full, path = "/", image = "/og-image.jpg", type = "website" }) => {
  const description = trim(full);
  const url = `${SITE}${path}`;
  const img = image.startsWith("http") ? image : `${SITE}${image}`;
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Alice Picco" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />
    </Head>
  );
};

export default Seo;
