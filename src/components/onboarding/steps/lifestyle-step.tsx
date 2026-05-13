'use client';

import { useOnboardingStore } from '@/stores/onboarding-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ACTIVITY_LEVELS,
  SLEEP_QUALITY_OPTIONS,
  STRESS_LEVELS,
} from '@/lib/constants';
import { motion } from 'framer-motion';
import type { ActivityLevel, SleepQuality, StressLevel } from '@/types';

export function LifestyleStep() {
  const { data, updateData, nextStep } = useOnboardingStore();

  const canContinue = data.activity_level && data.sleep_quality && data.stress_level;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold gradient-text mb-2">
          Lifestyle factors
        </h1>
        <p className="text-text-secondary">
          These affect recovery and program design.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          Activity level
        </label>
        <div className="space-y-2">
          {ACTIVITY_LEVELS.map((level) => (
            <motion.button
              key={level.value}
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                updateData({ activity_level: level.value as ActivityLevel })
              }
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 ${
                data.activity_level === level.value
                  ? 'border-forge-500 bg-forge-500/10'
                  : 'border-surface-border bg-surface-elevated'
              }`}
            >
              <div>
                <p
                  className={`text-sm font-medium ${
                    data.activity_level === level.value
                      ? 'text-forge-400'
                      : 'text-text-primary'
                  }`}
                >
                  {level.label}
                </p>
                <p className="text-xs text-text-tertiary">{level.description}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          Sleep quality
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SLEEP_QUALITY_OPTIONS.map((opt) => (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                updateData({ sleep_quality: opt.value as SleepQuality })
              }
              className={`p-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                data.sleep_quality === opt.value
                  ? 'border-forge-500 bg-forge-500/10 text-forge-400'
                  : 'border-surface-border bg-surface-elevated text-text-secondary'
              }`}
            >
              {opt.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          Stress level
        </label>
        <div className="grid grid-cols-2 gap-2">
          {STRESS_LEVELS.map((level) => (
            <motion.button
              key={level.value}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                updateData({ stress_level: level.value as StressLevel })
              }
              className={`p-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                data.stress_level === level.value
                  ? 'border-forge-500 bg-forge-500/10 text-forge-400'
                  : 'border-surface-border bg-surface-elevated text-text-secondary'
              }`}
            >
              {level.label}
            </motion.button>
          ))}
        </div>
      </div>

      <Input
        label="Nutrition preferences (optional)"
        placeholder="e.g., vegan, high protein, intermittent fasting"
        value={data.nutrition_preferences ?? ''}
        onChange={(e) => updateData({ nutrition_preferences: e.target.value })}
      />

      <Button
        onClick={nextStep}
        disabled={!canContinue}
        fullWidth
        size="lg"
      >
        Continue
      </Button>
    </div>
  );
}
