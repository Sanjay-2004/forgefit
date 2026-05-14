'use client';

import { useOnboardingStore } from '@/stores/onboarding-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function ReviewStep() {
  const { data } = useOnboardingStore();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const summaryItems = [
    { label: 'Age', value: data.age },
    { label: 'Sex', value: data.sex },
    { label: 'Height', value: data.height_cm ? `${data.height_cm} cm` : undefined },
    { label: 'Weight', value: data.weight_kg ? `${data.weight_kg} kg` : undefined },
    {
      label: 'Goals',
      value: data.fitness_goals?.map(g => g.replace(/_/g, ' ')).join(', '),
    },
    { label: 'Experience', value: data.experience_level },
    { label: 'Equipment', value: data.equipment_access?.map(e => e.replace(/_/g, ' ')).join(', ') },
    {
      label: 'Styles',
      value: data.preferred_styles?.join(', '),
    },
    { label: 'Days/week', value: data.workout_days_per_week },
    { label: 'Session', value: data.session_duration_minutes ? `${data.session_duration_minutes} min` : undefined },
    { label: 'Activity', value: data.activity_level?.replace(/_/g, ' ') },
    { label: 'Sleep', value: data.sleep_quality },
    { label: 'Stress', value: data.stress_level?.replace(/_/g, ' ') },
  ];

  async function handleSubmit() {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Try saving profile & preferences (non-blocking — tables may not exist yet)
      try {
        await supabase.from('profiles').upsert(
          {
            id: user.id,
            email: user.email ?? null,
            full_name: user.user_metadata?.full_name ?? null,
            avatar_url: user.user_metadata?.avatar_url ?? null,
          },
          { onConflict: 'id' }
        );

        await supabase.from('user_preferences').upsert({
          user_id: user.id,
          age: data.age,
          sex: data.sex,
          height_cm: data.height_cm,
          weight_kg: data.weight_kg,
          fitness_goal: data.fitness_goals?.[0] || null,
          experience_level: data.experience_level,
          injuries: data.injuries || null,
          equipment_access: data.equipment_access?.[0] || null,
          preferred_styles: data.preferred_styles,
          workout_days_per_week: data.workout_days_per_week,
          session_duration_minutes: data.session_duration_minutes,
          activity_level: data.activity_level,
          sleep_quality: data.sleep_quality,
          stress_level: data.stress_level,
          nutrition_preferences: data.nutrition_preferences || null,
        });

        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user.id);
      } catch (dbError) {
        console.warn('DB save skipped (tables may not exist):', dbError);
      }

      // Generate program
      const response = await fetch('/api/ai/generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null) as
          | { error?: string; details?: string }
          | null;
        const message =
          errorPayload?.details ||
          errorPayload?.error ||
          'Failed to generate program';
        throw new Error(message);
      }

      // Save the generated plan locally so dashboard/workout work even without DB
      const result = await response.json();
      if (result.weeklyPlan) {
        localStorage.setItem('forgefit_weekly_plan', JSON.stringify(result.weeklyPlan));
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to generate program';
      setSubmitError(message);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold gradient-text mb-2">
          Your profile summary
        </h1>
        <p className="text-text-secondary">
          Review your details before we create your personalized program.
        </p>
      </div>

      <Card className="space-y-4">
        {summaryItems
          .filter((item) => item.value)
          .map((item, index) => {
            // Check if value is a comma-separated list (for wrapped display)
            const isMultiItem = typeof item.value === 'string' && item.value.includes(', ');
            const itemList = isMultiItem ? item.value.split(', ') : null;

            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="py-2"
              >
                <span className="text-xs text-text-tertiary uppercase tracking-wide mb-2 block">
                  {item.label}
                </span>
                {itemList ? (
                  <div className="flex flex-wrap gap-2">
                    {itemList.map((val) => (
                      <span
                        key={val}
                        className="inline-block px-3 py-1 bg-forge-500/10 border border-forge-500/30 rounded-full text-xs font-medium text-forge-400 capitalize"
                      >
                        {val}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm font-medium text-text-primary capitalize">
                    {String(item.value)}
                  </span>
                )}
              </motion.div>
            );
          })}
      </Card>

      <Button
        onClick={handleSubmit}
        loading={isSubmitting}
        fullWidth
        size="lg"
      >
        <Sparkles className="w-5 h-5" />
        {isSubmitting ? 'Creating Your Program...' : 'Generate My Program'}
      </Button>

      {isSubmitting && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-text-tertiary"
        >
          Our AI is designing your personalized workout plan...
        </motion.p>
      )}

      {submitError && (
        <p className="text-center text-sm text-red-400">{submitError}</p>
      )}
    </div>
  );
}
