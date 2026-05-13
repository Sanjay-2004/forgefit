'use client';

import { useOnboardingStore } from '@/stores/onboarding-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import type { Sex } from '@/types';

const sexOptions: { value: Sex; label: string; icon: string }[] = [
  { value: 'male', label: 'Male', icon: '♂' },
  { value: 'female', label: 'Female', icon: '♀' },
  { value: 'other', label: 'Other', icon: '⚧' },
];

export function BasicsStep() {
  const { data, updateData, nextStep } = useOnboardingStore();

  const canContinue = data.age && data.sex;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold gradient-text mb-2">
          Let&apos;s get to know you
        </h1>
        <p className="text-text-secondary">
          This helps us personalize your training experience.
        </p>
      </div>

      <div className="space-y-6">
        <Input
          label="Age"
          type="number"
          placeholder="Enter your age"
          value={data.age ?? ''}
          onChange={(e) =>
            updateData({ age: e.target.value ? parseInt(e.target.value) : undefined })
          }
          min={13}
          max={100}
        />

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-3">
            Sex
          </label>
          <div className="grid grid-cols-3 gap-3">
            {sexOptions.map((option) => (
              <motion.button
                key={option.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => updateData({ sex: option.value })}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                  data.sex === option.value
                    ? 'border-forge-500 bg-forge-500/10 text-forge-400'
                    : 'border-surface-border bg-surface-elevated text-text-secondary hover:border-surface-border/80'
                }`}
              >
                <span className="text-2xl">{option.icon}</span>
                <span className="text-sm font-medium">{option.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

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
