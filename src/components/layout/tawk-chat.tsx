"use client";

import Script from "next/script";

// Set NEXT_PUBLIC_TAWK_SRC to the embed URL of the Haven Snus Tawk.to property to turn chat on.
const TAWK_SRC = process.env.NEXT_PUBLIC_TAWK_SRC;

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
