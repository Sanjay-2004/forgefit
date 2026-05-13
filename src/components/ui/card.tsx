'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover = false, glow = false, onClick }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
      className={cn(
        'bg-surface-card rounded-2xl border border-surface-border p-4',
        'transition-all duration-300',
        hover && 'cursor-pointer hover:border-forge-500/20 hover:shadow-card-hover',
        glow && 'shadow-glow animate-glow-pulse',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
