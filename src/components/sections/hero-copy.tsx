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

const EYEBROW = "Nicotine pouches · Australia & New Zealand";
const BODY =
  "ZYN, VELO, PABLO, KILLA and 30+ more brands. Every strength from light to extreme, every flavour from cool mint to cola, shipped with tracking to your door.";

export function HeroCopy() {
  const reduceMotion = useReducedMotion();
  const anim = (delay: number) =>
    reduceMotion ? {} : { custom: delay, variants: fade, initial: "hidden", animate: "show" };

  return (
    <div className="max-w-2xl">
      <motion.p {...anim(0.05)} className="eyebrow !text-orange-400 !mb-4">
        {EYEBROW}
      </motion.p>

      <motion.h1 {...anim(0.15)} className="display-xl text-white">
        Your haven for nicotine pouches
        <span className="text-orange-500">.</span>
      </motion.h1>

      <motion.p {...anim(0.28)} className="mt-5 max-w-xl text-lg leading-relaxed text-slate-200">
        {BODY}
      </motion.p>

      <motion.div {...anim(0.4)} className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-4">
        <Link href="/products" className="btn-primary px-7 py-4 text-[0.9375rem]">
          Shop all pouches
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/brands"
          className="link-arrow !border-white/30 !text-white hover:!border-orange-400 hover:!text-orange-300"
        >
          Browse brands
        </Link>
      </motion.div>
    </div>
  );
}
