import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" type="image/svg+xml" href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/favicon.svg`} />
        <link rel="icon" type="image/png" sizes="32x32" href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/favicon-32.png`} />
        <link rel="apple-touch-icon" href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/apple-touch-icon.png`} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
        {/* the browser bar takes the page colour; the script below switches it with the theme */}
        <meta name="theme-color" content="#D5D6DB" />
        {/* the visitor's settings before paint. The colour shuffle is gone: forget any palette saved earlier.
            Theme: light for everyone, dark only when the visitor has picked it (the device setting is ignored). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{localStorage.removeItem("fu-palette");var h=document.documentElement,m=localStorage.getItem("ap-motion"),c=localStorage.getItem("ap-contrast");' +
              'if(!m&&window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)m="off";if(m)h.dataset.motion=m;if(c)h.dataset.contrast=c;' +
              'var t=localStorage.getItem("ap-theme")==="dark"?"dark":"light";h.dataset.theme=t;' +
              'var tc=document.querySelector(\'meta[name="theme-color"]\');if(tc)tc.content=t==="dark"?"#0E0E10":"#D5D6DB";' +
              '}catch(e){}',
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
