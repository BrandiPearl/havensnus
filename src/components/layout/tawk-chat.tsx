"use client";

import Script from "next/script";

// Haven Snus Tawk.to widget. Set NEXT_PUBLIC_TAWK_SRC
// (Cloudflare build variable) to override it.
const TAWK_SRC = process.env.NEXT_PUBLIC_TAWK_SRC || "https://embed.tawk.to/6ad029acf527c734c0aa9983/1k4ui5imo";

export function TawkChat() {
  if (!TAWK_SRC) return null;
  return (
    <Script id="tawk-to" strategy="lazyOnload">
      {`
        var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
        (function(){
          var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
          s1.async=true;
          s1.src=${JSON.stringify(TAWK_SRC)};
          s1.charset="UTF-8";
          s1.setAttribute("crossorigin","*");
          s0.parentNode.insertBefore(s1,s0);
        })();
      `}
    </Script>
  );
}
