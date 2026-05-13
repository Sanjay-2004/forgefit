'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ONBOARDING_STEPS } from '@/types';
import { BasicsStep } from './steps/basics-step';
import { BodyStep } from './steps/body-step';
import { GoalsStep } from './steps/goals-step';
import { ExperienceStep } from './steps/experience-step';
import { EquipmentStep } from './steps/equipment-step';
import { StyleStep } from './steps/style-step';
import { ScheduleStep } from './steps/schedule-step';
import { LifestyleStep } from './steps/lifestyle-step';
import { ReviewStep } from './steps/review-step';
import { ChevronLeft } from 'lucide-react';

const steps = [
  BasicsStep,
  BodyStep,
  GoalsStep,
  ExperienceStep,
  EquipmentStep,
  StyleStep,
  ScheduleStep,
  LifestyleStep,
  ReviewStep,
];

const stepTitles = [
  'About You',
  'Your Body',
  'Your Goals',
  'Experience',
  'Equipment',
  'Training Style',
  'Schedule',
  'Lifestyle',
  'Review',
];

export function OnboardingWizard() {
  const { currentStep, prevStep } = useOnboardingStore();
  const StepComponent = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-surface bg-gradient-mesh flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 glass px-4 pt-safe">
        <div className="flex items-center h-14">
          {currentStep > 0 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={prevStep}
              className="p-2 -ml-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
          )}
          <div className="flex-1 text-center">
            <p className="text-xs text-text-tertiary uppercase tracking-wider">
              Step {currentStep + 1} of {steps.length}
            </p>
            <h2 className="text-sm font-semibold text-text-primary">
              {stepTitles[currentStep]}
            </h2>
          </div>
          {currentStep > 0 && <div className="w-9" />}
        </div>
        <ProgressBar value={progress} size="sm" className="pb-2" />
      </div>

      {/* Step Content */}
      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <StepComponent />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
