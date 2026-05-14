'use client';

import { useOnboardingStore } from '@/stores/onboarding-store';
import { Button } from '@/components/ui/button';
import { FITNESS_GOALS } from '@/lib/constants';
import { motion } from 'framer-motion';
import type { FitnessGoal } from '@/types';

export function GoalsStep() {
  const { data, updateData, nextStep } = useOnboardingStore();

  const toggleGoal = (goal: FitnessGoal) => {
    const goals = data.fitness_goals || [];
    const MAX_GOALS = 3;
    if (goals.includes(goal)) {
      updateData({ fitness_goals: goals.filter(g => g !== goal) });
    } else if (goals.length < MAX_GOALS) {
      updateData({ fitness_goals: [...goals, goal] });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold gradient-text mb-2">
          What are your goals?
        </h1>
        <p className="text-text-secondary">
          Select up to 3. This shapes your personalized program.
        </p>
      </div>

      <div className="space-y-3">
        {FITNESS_GOALS.map((goal, index) => {
          const isSelected = (data.fitness_goals || []).includes(goal.value as FitnessGoal);
          return (
            <motion.button
              key={goal.value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleGoal(goal.value as FitnessGoal)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left ${
                isSelected
                  ? 'border-forge-500 bg-forge-500/10'
                  : 'border-surface-border bg-surface-elevated hover:border-surface-border/80'
              }`}
            >
              <span className="text-2xl flex-shrink-0">{goal.icon}</span>
              <div>
                <p
                  className={`font-semibold ${
                    isSelected
                      ? 'text-forge-400'
                      : 'text-text-primary'
                  }`}
                >
                  {goal.label}
                </p>
                <p className="text-sm text-text-tertiary">{goal.description}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      <Button
        onClick={nextStep}
        disabled={(data.fitness_goals || []).length === 0}
        fullWidth
        size="lg"
      >
        Continue
      </Button>
    </div>
  );
}
