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

  const summaryItems = [
    { label: 'Age', value: data.age },
    { label: 'Sex', value: data.sex },
    { label: 'Height', value: data.height_cm ? `${data.height_cm} cm` : undefined },
    { label: 'Weight', value: data.weight_kg ? `${data.weight_kg} kg` : undefined },
    {
      label: 'Goal',
      value: data.fitness_goal?.replace(/_/g, ' '),
    },
    { label: 'Experience', value: data.experience_level },
    { label: 'Equipment', value: data.equipment_access?.replace(/_/g, ' ') },
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
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Save preferences
      await supabase.from('user_preferences').upsert({
        user_id: user.id,
        age: data.age,
        sex: data.sex,
        height_cm: data.height_cm,
        weight_kg: data.weight_kg,
        fitness_goal: data.fitness_goal,
        experience_level: data.experience_level,
        injuries: data.injuries || null,
        equipment_access: data.equipment_access,
        preferred_styles: data.preferred_styles,
        workout_days_per_week: data.workout_days_per_week,
        session_duration_minutes: data.session_duration_minutes,
        activity_level: data.activity_level,
        sleep_quality: data.sleep_quality,
        stress_level: data.stress_level,
        nutrition_preferences: data.nutrition_preferences || null,
      });

      // Mark onboarding complete
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      // Generate program
      const response = await fetch('/api/ai/generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to generate program');
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
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

      <Card className="space-y-3">
        {summaryItems
          .filter((item) => item.value)
          .map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="flex justify-between items-center py-1"
            >
              <span className="text-sm text-text-tertiary">{item.label}</span>
              <span className="text-sm font-medium text-text-primary capitalize">
                {String(item.value)}
              </span>
            </motion.div>
          ))}
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
    </div>
  );
}
