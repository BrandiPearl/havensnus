"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function HeroCopy() {
  const reduceMotion = useReducedMotion();
  const anim = (delay: number) =>
    reduceMotion ? {} : { custom: delay, variants: fade, initial: "hidden", animate: "show" };

  return (
    <div className="mx-auto max-w-2xl text-center">
      <motion.h1
        {...anim(0.1)}
        className="display-xl text-white !text-[clamp(2.25rem,5vw,3.75rem)] !leading-[1.02]"
      >
        30+ brands.{" "}
        <span className="bg-gradient-to-r from-[#3fb39b] via-[#e9ae3a] to-[#e0217a] bg-clip-text text-transparent">
          One haven.
        </span>
      </motion.h1>

      <motion.p {...anim(0.22)} className="mx-auto mt-4 max-w-md text-base leading-relaxed text-slate-300 sm:text-[1.0625rem]">
        ZYN, VELO, PABLO, KILLA and more, in every strength and flavour. Tracked delivery Australia-wide.
      </motion.p>

      <motion.div {...anim(0.34)} className="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        <Link href="/products" className="btn-primary px-7 py-4 text-[0.9375rem]">
          Shop all pouches
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/brands"
          className="link-arrow !border-white/30 !text-white hover:!border-orange-400 hover:!text-orange-300"
        >
          See all brands
        </Link>
      </motion.div>
    </div>
  );
}
