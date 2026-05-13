'use client';

import { useOnboardingStore } from '@/stores/onboarding-store';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const dayOptions = [2, 3, 4, 5, 6];
const durationOptions = [30, 45, 60, 75, 90];

export function ScheduleStep() {
  const { data, updateData, nextStep } = useOnboardingStore();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold gradient-text mb-2">
          Your schedule
        </h1>
        <p className="text-text-secondary">
          How many days can you commit to training?
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          Workout days per week
        </label>
        <div className="flex gap-3">
          {dayOptions.map((num) => (
            <motion.button
              key={num}
              whileTap={{ scale: 0.9 }}
              onClick={() => updateData({ workout_days_per_week: num })}
              className={`flex-1 py-4 rounded-xl border text-center font-bold text-lg transition-all duration-200 ${
                data.workout_days_per_week === num
                  ? 'border-forge-500 bg-forge-500/10 text-forge-400'
                  : 'border-surface-border bg-surface-elevated text-text-secondary'
              }`}
            >
              {num}
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          Session duration (minutes)
        </label>
        <div className="flex gap-2 flex-wrap">
          {durationOptions.map((min) => (
            <motion.button
              key={min}
              whileTap={{ scale: 0.95 }}
              onClick={() => updateData({ session_duration_minutes: min })}
              className={`px-5 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                data.session_duration_minutes === min
                  ? 'border-forge-500 bg-forge-500/10 text-forge-400'
                  : 'border-surface-border bg-surface-elevated text-text-secondary'
              }`}
            >
              {min}min
            </motion.button>
          ))}
        </div>
      </div>

      <Button onClick={nextStep} fullWidth size="lg">
        Continue
      </Button>
    </div>
  );
}
