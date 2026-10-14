"use client";

import Script from "next/script";

// Same Tawk.to widget as the Wonderland site for now. Set NEXT_PUBLIC_TAWK_SRC
// (Cloudflare build variable) to a Haven Snus property's embed URL to switch.
const TAWK_SRC = process.env.NEXT_PUBLIC_TAWK_SRC || "https://embed.tawk.to/6a85c6b2ae3056344ea6ff6d/1k0d90b14";

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
