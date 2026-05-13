'use client';

import { useOnboardingStore } from '@/stores/onboarding-store';
import { Button } from '@/components/ui/button';
import { FITNESS_GOALS } from '@/lib/constants';
import { motion } from 'framer-motion';
import type { FitnessGoal } from '@/types';

export function GoalsStep() {
  const { data, updateData, nextStep } = useOnboardingStore();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold gradient-text mb-2">
          What&apos;s your goal?
        </h1>
        <p className="text-text-secondary">
          This shapes everything about your program.
        </p>
      </div>

      <div className="space-y-3">
        {FITNESS_GOALS.map((goal, index) => (
          <motion.button
            key={goal.value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => updateData({ fitness_goal: goal.value as FitnessGoal })}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left ${
              data.fitness_goal === goal.value
                ? 'border-forge-500 bg-forge-500/10'
                : 'border-surface-border bg-surface-elevated hover:border-surface-border/80'
            }`}
          >
            <span className="text-2xl flex-shrink-0">{goal.icon}</span>
            <div>
              <p
                className={`font-semibold ${
                  data.fitness_goal === goal.value
                    ? 'text-forge-400'
                    : 'text-text-primary'
                }`}
              >
                {goal.label}
              </p>
              <p className="text-sm text-text-tertiary">{goal.description}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <Button
        onClick={nextStep}
        disabled={!data.fitness_goal}
        fullWidth
        size="lg"
      >
        Continue
      </Button>
    </div>
  );
}
