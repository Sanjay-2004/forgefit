'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Dumbbell, Sparkles, BarChart3, Brain } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface bg-gradient-mesh flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-6 max-w-md"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-forge-500 to-accent-purple flex items-center justify-center shadow-glow-lg"
          >
            <Dumbbell className="w-12 h-12 text-white" />
          </motion.div>

          <div className="space-y-3">
            <h1 className="text-5xl font-bold tracking-tight">
              <span className="gradient-text">ForgeFit</span>
            </h1>
            <p className="text-xl text-text-secondary leading-relaxed">
              AI-powered intelligent workout coaching. 
              Personalized programs that adapt to you.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-3 gap-4 pt-6"
          >
            {[
              { icon: Sparkles, label: 'AI Programs' },
              { icon: BarChart3, label: 'Smart Analytics' },
              { icon: Brain, label: 'Adaptive Coach' },
            ].map(({ icon: Icon, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className="flex flex-col items-center gap-2 p-3"
              >
                <div className="w-10 h-10 rounded-xl bg-surface-card border border-surface-border flex items-center justify-center">
                  <Icon className="w-5 h-5 text-forge-400" />
                </div>
                <span className="text-xs text-text-tertiary">{label}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="pt-6 space-y-3"
          >
            <Link href="/login">
              <Button fullWidth size="lg">
                Get Started
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
