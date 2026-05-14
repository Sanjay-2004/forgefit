'use client';

import { useOnboardingStore } from '@/stores/onboarding-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { motion } from 'framer-motion';

export function BodyStep() {
  const { data, updateData, nextStep } = useOnboardingStore();
  const [heightUnit, setHeightUnit] = useState<'cm' | 'feet'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [heightFeet, setHeightFeet] = useState<number | undefined>(undefined);
  const [heightInches, setHeightInches] = useState<number | undefined>(undefined);

  const canContinue = data.height_cm && data.weight_kg;

  const handleHeightCmChange = (value: string) => {
    if (!value) {
      updateData({ height_cm: undefined });
      return;
    }
    updateData({ height_cm: parseFloat(value) });
  };

  const handleHeightFeetInchesChange = () => {
    if (heightFeet === undefined || heightInches === undefined) return;
    const totalInches = heightFeet * 12 + heightInches;
    const cm = totalInches * 2.54;
    updateData({ height_cm: Math.round(cm) });
  };

  const handleWeightChange = (value: string) => {
    if (!value) {
      updateData({ weight_kg: undefined });
      return;
    }
    const num = parseFloat(value);
    if (weightUnit === 'kg') {
      updateData({ weight_kg: num });
    } else {
      updateData({ weight_kg: Math.round(num * 0.453592 * 10) / 10 });
    }
  };

  // Display height based on unit
  let displayHeight = '';
  if (heightUnit === 'cm') {
    displayHeight = data.height_cm ? data.height_cm.toString() : '';
  } else {
    if (data.height_cm) {
      const totalInches = data.height_cm / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      displayHeight = `${feet}'${inches}"`;
    }
  }

  const displayWeight = weightUnit === 'kg' 
    ? (data.weight_kg?.toString() ?? '') 
    : (data.weight_kg ? Math.round(data.weight_kg / 0.453592).toString() : '');

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
        {/* Height */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-text-secondary">
              Height: {displayHeight}
            </label>
            <div className="flex gap-2">
              {(['cm', 'feet'] as const).map((unit) => (
                <motion.button
                  key={unit}
                  onClick={() => setHeightUnit(unit)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    heightUnit === unit
                      ? 'bg-forge-500 text-black'
                      : 'bg-surface-elevated text-text-secondary border border-surface-border'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  {unit}
                </motion.button>
              ))}
            </div>
          </div>

          {heightUnit === 'cm' ? (
            <Input
              type="number"
              placeholder="175"
              value={data.height_cm ?? ''}
              onChange={(e) => handleHeightCmChange(e.target.value)}
              min={100}
              max={250}
              step={1}
            />
          ) : (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-text-tertiary">Feet</label>
                <Input
                  type="number"
                  placeholder="5"
                  value={heightFeet ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value) : undefined;
                    setHeightFeet(val);
                    if (val !== undefined && heightInches !== undefined) {
                      const totalInches = val * 12 + heightInches;
                      const cm = totalInches * 2.54;
                      updateData({ height_cm: Math.round(cm) });
                    }
                  }}
                  min={3}
                  max={8}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-text-tertiary">Inches</label>
                <Input
                  type="number"
                  placeholder="6"
                  value={heightInches ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value) : undefined;
                    setHeightInches(val);
                    if (heightFeet !== undefined && val !== undefined) {
                      const totalInches = heightFeet * 12 + val;
                      const cm = totalInches * 2.54;
                      updateData({ height_cm: Math.round(cm) });
                    }
                  }}
                  min={0}
                  max={11}
                />
              </div>
            </div>
          )}
        </div>

        {/* Weight */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-text-secondary">
              Weight: {displayWeight} {weightUnit}
            </label>
            <div className="flex gap-2">
              {(['kg', 'lbs'] as const).map((unit) => (
                <motion.button
                  key={unit}
                  onClick={() => setWeightUnit(unit)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    weightUnit === unit
                      ? 'bg-forge-500 text-black'
                      : 'bg-surface-elevated text-text-secondary border border-surface-border'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  {unit}
                </motion.button>
              ))}
            </div>
          </div>
          <Input
            type="number"
            placeholder={weightUnit === 'kg' ? '75' : '165'}
            value={displayWeight}
            onChange={(e) => handleWeightChange(e.target.value)}
            min={weightUnit === 'kg' ? 30 : 66}
            max={weightUnit === 'kg' ? 300 : 661}
            step={1}
          />
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
