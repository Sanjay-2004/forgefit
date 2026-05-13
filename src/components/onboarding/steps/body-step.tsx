'use client';

import { useOnboardingStore } from '@/stores/onboarding-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function BodyStep() {
  const { data, updateData, nextStep } = useOnboardingStore();

  const canContinue = data.height_cm && data.weight_kg;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold gradient-text mb-2">
          Your body metrics
        </h1>
        <p className="text-text-secondary">
          We&apos;ll use this to calibrate your program intensity.
        </p>
      </div>

      <div className="space-y-6">
        <Input
          label="Height (cm)"
          type="number"
          placeholder="175"
          value={data.height_cm ?? ''}
          onChange={(e) =>
            updateData({
              height_cm: e.target.value ? parseFloat(e.target.value) : undefined,
            })
          }
          min={100}
          max={250}
        />

        <Input
          label="Weight (kg)"
          type="number"
          placeholder="75"
          value={data.weight_kg ?? ''}
          onChange={(e) =>
            updateData({
              weight_kg: e.target.value ? parseFloat(e.target.value) : undefined,
            })
          }
          min={30}
          max={300}
        />
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
