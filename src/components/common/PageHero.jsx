import { motion } from 'framer-motion';

const TONES = {
  blue: 'from-[#0c2f73] via-[#1450bd] to-[#0891b2]',
  teal: 'from-[#0b3d91] via-[#0e7490] to-[#0d9488]',
  booking: 'from-[#2a1a73] via-[#5b3fe0] to-[#0ea5e9]',
};

/** Animated banner that opens a page: gradient, drifting glow orbs, grid, icon, title and optional actions. */
export default function PageHero({ icon: Icon, eyebrow, title, subtitle, tone = 'blue', children, className = '' }) {
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${TONES[tone]} px-6 py-7 text-white shadow-lift sm:px-9 sm:py-9 ${className}`}>
      <div className="hero-grid absolute inset-0" aria-hidden />
      <div aria-hidden className="absolute -right-16 -top-20 h-64 w-64 animate-aurora-a rounded-full bg-white/20 blur-3xl" />
      <div aria-hidden className="absolute -bottom-24 left-1/4 h-56 w-56 animate-aurora-b rounded-full bg-aqua-400/30 blur-3xl" />
      <div aria-hidden className="absolute right-[12%] top-[18%] h-3 w-3 animate-float rounded-full bg-aqua-300/80" />
      <div aria-hidden className="absolute right-[26%] bottom-[18%] h-2 w-2 animate-float rounded-full bg-coral-400/80 [animation-delay:-2s]" />
      <div aria-hidden className="absolute right-[6%] bottom-[30%] h-4 w-4 animate-float rounded-full border border-white/40 [animation-delay:-4s]" />
      <div className="relative flex flex-wrap items-center justify-between gap-5">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          {Icon && <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur"><Icon className="h-7 w-7 text-white" aria-hidden /></span>}
          <div className="min-w-0">
            {eyebrow && <p className="text-xs font-semibold uppercase tracking-[.2em] text-white">{eyebrow}</p>}
            <h1 className="text-2xl font-semibold !text-white sm:text-4xl">{title}</h1>
            {subtitle && <p className="mt-1 max-w-2xl text-sm text-white/85">{subtitle}</p>}
          </div>
        </div>
        {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
      </div>
    </motion.section>
  );
}
