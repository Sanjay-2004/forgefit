'use client';

import { useOnboardingStore } from '@/stores/onboarding-store';
import { Button } from '@/components/ui/button';
import { EXPERIENCE_LEVELS } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import type { ExperienceLevel } from '@/types';

export function ExperienceStep() {
  const { data, updateData, nextStep } = useOnboardingStore();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold gradient-text mb-2">
          Training experience
        </h1>
        <p className="text-text-secondary">
          We&apos;ll match complexity and volume to your level.
        </p>
      </div>

      <div className="space-y-3">
        {EXPERIENCE_LEVELS.map((level, index) => (
          <motion.button
            key={level.value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              updateData({ experience_level: level.value as ExperienceLevel })
            }
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
              data.experience_level === level.value
                ? 'border-forge-500 bg-forge-500/10'
                : 'border-surface-border bg-surface-elevated hover:border-surface-border/80'
            }`}
          >
            <div className="text-left">
              <p
                className={`font-semibold ${
                  data.experience_level === level.value
                    ? 'text-forge-400'
                    : 'text-text-primary'
                }`}
              >
                {level.label}
              </p>
              <p className="text-sm text-text-tertiary">{level.description}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <Input
        label="Any injuries or limitations? (optional)"
        placeholder="e.g., lower back pain, knee issues"
        value={data.injuries ?? ''}
        onChange={(e) => updateData({ injuries: e.target.value })}
      />

      <Button
        onClick={nextStep}
        disabled={!data.experience_level}
        fullWidth
        size="lg"
      >
        Continue
      </Button>
    </div>
  );
}
