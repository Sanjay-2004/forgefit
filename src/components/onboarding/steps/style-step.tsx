'use client';

import { useOnboardingStore } from '@/stores/onboarding-store';
import { Button } from '@/components/ui/button';
import { WORKOUT_STYLES } from '@/lib/constants';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { WorkoutStyle } from '@/types';

export function StyleStep() {
  const { data, toggleStyle, nextStep } = useOnboardingStore();
  const selectedStyles = data.preferred_styles ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold gradient-text mb-2">
          Preferred training styles
        </h1>
        <p className="text-text-secondary">
          Select all that interest you. We&apos;ll blend them into your program.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {WORKOUT_STYLES.map((style, index) => {
          const isSelected = selectedStyles.includes(style.value as WorkoutStyle);
          return (
            <motion.button
              key={style.value}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleStyle(style.value as WorkoutStyle)}
              className={`relative flex items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
                isSelected
                  ? 'border-forge-500 bg-forge-500/10 text-forge-400'
                  : 'border-surface-border bg-surface-elevated text-text-secondary hover:border-surface-border/80'
              }`}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2"
                >
                  <Check className="w-4 h-4 text-forge-400" />
                </motion.div>
              )}
              <span className="text-sm font-medium">{style.label}</span>
            </motion.button>
          );
        })}
      </div>

      <Button
        onClick={nextStep}
        disabled={selectedStyles.length === 0}
        fullWidth
        size="lg"
      >
        Continue
      </Button>
    </div>
  );
}
