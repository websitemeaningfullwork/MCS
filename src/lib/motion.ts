import type { Variants } from "framer-motion";

/** Apple-style easing — used across all MCA motion. */
export const easeApple = [0.22, 1, 0.36, 1] as const;

/** Standard duration for subtle transitions (250ms). */
export const durationBase = 0.25;

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: durationBase, ease: easeApple },
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durationBase, ease: easeApple },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: durationBase, ease: easeApple },
  },
};

/** Stagger container — reveals children one after another. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};
