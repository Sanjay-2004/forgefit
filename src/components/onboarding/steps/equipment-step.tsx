'use client';

import { useOnboardingStore } from '@/stores/onboarding-store';
import { Button } from '@/components/ui/button';
import { EQUIPMENT_OPTIONS } from '@/lib/constants';
import { motion } from 'framer-motion';
import type { EquipmentAccess } from '@/types';

export function EquipmentStep() {
  const { data, updateData, nextStep } = useOnboardingStore();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold gradient-text mb-2">
          Equipment access
        </h1>
        <p className="text-text-secondary">
          We&apos;ll design your program around what you have.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {EQUIPMENT_OPTIONS.map((option, index) => (
          <motion.button
            key={option.value}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              updateData({ equipment_access: option.value as EquipmentAccess })
            }
            className={`flex flex-col items-center gap-2 p-5 rounded-xl border transition-all duration-200 ${
              data.equipment_access === option.value
                ? 'border-forge-500 bg-forge-500/10 text-forge-400'
                : 'border-surface-border bg-surface-elevated text-text-secondary hover:border-surface-border/80'
            }`}
          >
            <span className="text-3xl">{option.icon}</span>
            <span className="text-sm font-medium text-center">{option.label}</span>
          </motion.button>
        ))}
      </div>

      <Button
        onClick={nextStep}
        disabled={!data.equipment_access}
        fullWidth
        size="lg"
      >
        Continue
      </Button>
    </div>
  );
}
