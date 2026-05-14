'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/skeleton';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/transitions';
import { Play, Dumbbell, Clock, ChevronRight } from 'lucide-react';
import type { WorkoutTemplate, WorkoutProgram, MuscleGroup } from '@/types';
import Link from 'next/link';

export default function WorkoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [program, setProgram] = useState<WorkoutProgram | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { data: prog } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    setProgram(prog);

    if (prog) {
      const { data: tmpl } = await supabase
        .from('workout_templates')
        .select('*')
        .eq('program_id', prog.id)
        .order('day_of_week');

      setTemplates(tmpl ?? []);
    } else {
      // Fall back to localStorage if DB has no program
      try {
        const stored = localStorage.getItem('forgefit_weekly_plan');
        if (stored) {
          const weeklyPlan = JSON.parse(stored);
          setProgram({
            id: 'local',
            name: weeklyPlan.programName,
            goal: weeklyPlan.goal,
            weekly_plan: weeklyPlan,
            is_active: true,
          } as unknown as WorkoutProgram);

          const virtualTemplates = weeklyPlan.weeklyPlan.map(
            (day: { day: string; focus: string; exercises: unknown[]; warmup?: string[]; cooldown?: string[] }, i: number) => ({
              id: `local-${i}`,
              program_id: 'local',
              day_of_week: i,
              name: `${day.day} — ${day.focus}`,
              focus: day.focus,
              exercises: day.exercises,
              warmup: day.warmup ? { exercises: day.warmup, duration_minutes: 5 } : null,
              cooldown: day.cooldown ? { exercises: day.cooldown, duration_minutes: 5 } : null,
              estimated_duration_minutes: 60,
            })
          );
          setTemplates(virtualTemplates as WorkoutTemplate[]);
        }
      } catch {
        // ignore parse errors
      }
    }

    setLoading(false);
  }

  async function startWorkout(template: WorkoutTemplate) {
    // Can't start a session for locally-stored templates (no DB yet)
    if (String(template.id).startsWith('local-')) {
      // TODO: once DB tables exist, this will work
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: session, error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: user.id,
        template_id: template.id,
        program_id: template.program_id,
        name: template.name,
        focus: template.focus,
        status: 'in_progress',
      })
      .select()
      .single();

    if (session && !error) {
      router.push(`/workout/${session.id}`);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="px-4 pt-12 space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-4 pt-12 pb-4 space-y-6">
        <FadeIn>
          <div>
            <h1 className="text-2xl font-bold">Workouts</h1>
            <p className="text-text-tertiary text-sm mt-1">
              {program?.name ?? 'No active program'}
            </p>
          </div>
        </FadeIn>

        {templates.length > 0 ? (
          <StaggerContainer className="space-y-3">
            {templates.map((template, index) => {
              const exercises = template.exercises as {
                name: string;
                muscles: MuscleGroup[];
                sets: number;
                repRange: string;
              }[];
              const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
              const uniqueMuscles = new Set(
                exercises.flatMap((ex) => ex.muscles)
              );

              return (
                <StaggerItem key={template.id}>
                  <Card hover className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-forge-500/10 text-forge-400 font-medium">
                            Day {index + 1}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg mt-1">
                          {template.focus}
                        </h3>
                        <p className="text-sm text-text-tertiary flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1">
                            <Dumbbell className="w-3.5 h-3.5" />
                            {exercises.length} exercises
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            ~{template.estimated_duration_minutes}min
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {exercises.slice(0, 4).map((ex, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="text-text-secondary">{ex.name}</span>
                          <span className="text-text-tertiary text-xs">
                            {ex.sets} × {ex.repRange}
                          </span>
                        </div>
                      ))}
                      {exercises.length > 4 && (
                        <p className="text-xs text-text-tertiary">
                          +{exercises.length - 4} more exercises
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={() => startWorkout(template)}
                      fullWidth
                      variant="secondary"
                    >
                      <Play className="w-4 h-4" />
                      Start Session
                    </Button>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        ) : (
          <Card>
            <div className="text-center py-8 space-y-3">
              <Dumbbell className="w-12 h-12 text-text-tertiary mx-auto" />
              <p className="text-text-secondary">No workout program found</p>
              <Link href="/onboarding">
                <Button variant="secondary">Create Program</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
