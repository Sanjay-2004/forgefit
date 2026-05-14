'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { CardSkeleton } from '@/components/ui/skeleton';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/transitions';
import { MuscleMapMini } from '@/components/muscle-map/muscle-map-mini';
import {
  Flame,
  Zap,
  Trophy,
  Calendar,
  ChevronRight,
  Play,
  TrendingUp,
} from 'lucide-react';
import type { WorkoutProgram, WorkoutSession, MuscleGroup } from '@/types';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({
    workoutsCompleted: 0,
    totalVolume: 0,
    streak: 0,
    musclesWorked: [] as MuscleGroup[],
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const [profileRes, programRes, sessionsRes, logsRes] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),
      supabase
        .from('workout_programs')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single(),
      supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(5),
      supabase
        .from('exercise_logs')
        .select('muscles_worked, weight_kg, reps')
        .eq('user_id', user.id)
        .eq('is_completed', true)
        .gte(
          'created_at',
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        ),
    ]);

    setProfile(profileRes.data);
    setRecentSessions(sessionsRes.data ?? []);

    // Use DB program if available, otherwise fall back to localStorage
    if (programRes.data) {
      setProgram(programRes.data);
    } else {
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
        }
      } catch {
        // ignore parse errors
      }
    }

    // Compute weekly stats
    const completedThisWeek = (sessionsRes.data ?? []).filter(
      (s) => s.status === 'completed'
    );

    const allMuscles = new Set<MuscleGroup>();
    let totalVol = 0;
    (logsRes.data ?? []).forEach((log) => {
      (log.muscles_worked as MuscleGroup[])?.forEach((m) => allMuscles.add(m));
      totalVol += (log.weight_kg ?? 0) * (log.reps ?? 0);
    });

    // Streak calculation
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const dayStr = day.toISOString().split('T')[0];
      const hasWorkout = (sessionsRes.data ?? []).some(
        (s) =>
          s.status === 'completed' &&
          s.started_at.startsWith(dayStr)
      );
      if (hasWorkout || i === 0) {
        if (hasWorkout) streak++;
      } else {
        break;
      }
    }

    setWeeklyStats({
      workoutsCompleted: completedThisWeek.length,
      totalVolume: totalVol,
      streak,
      musclesWorked: Array.from(allMuscles),
    });

    setLoading(false);
  }

  const todayIndex = new Date().getDay();
  // Convert Sunday=0 to Monday=0 format
  const adjustedDay = todayIndex === 0 ? 6 : todayIndex - 1;
  const todayWorkout = program?.weekly_plan
    ? (program.weekly_plan as { weeklyPlan: { day: string; focus: string; exercises: { name: string; muscles: MuscleGroup[] }[] }[] }).weeklyPlan?.[adjustedDay % ((program.weekly_plan as { weeklyPlan: unknown[] }).weeklyPlan?.length ?? 1)]
    : null;

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Athlete';

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
        {/* Greeting */}
        <FadeIn>
          <div>
            <p className="text-text-tertiary text-sm">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <h1 className="text-2xl font-bold mt-1">
              Hey, {firstName} 👋
            </h1>
          </div>
        </FadeIn>

        {/* Quick Stats */}
        <FadeIn delay={0.1}>
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center py-3">
              <Flame className="w-5 h-5 text-accent-orange mx-auto mb-1" />
              <p className="text-xl font-bold">{weeklyStats.streak}</p>
              <p className="text-xs text-text-tertiary">Streak</p>
            </Card>
            <Card className="text-center py-3">
              <Zap className="w-5 h-5 text-accent-green mx-auto mb-1" />
              <p className="text-xl font-bold">{weeklyStats.workoutsCompleted}</p>
              <p className="text-xs text-text-tertiary">This Week</p>
            </Card>
            <Card className="text-center py-3">
              <Trophy className="w-5 h-5 text-accent-yellow mx-auto mb-1" />
              <p className="text-xl font-bold">
                {weeklyStats.totalVolume > 1000
                  ? `${(weeklyStats.totalVolume / 1000).toFixed(1)}k`
                  : weeklyStats.totalVolume}
              </p>
              <p className="text-xs text-text-tertiary">Volume (kg)</p>
            </Card>
          </div>
        </FadeIn>

        {/* Today's Workout */}
        <FadeIn delay={0.2}>
          {todayWorkout ? (
            <Card className="gradient-border overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs text-forge-400 font-medium uppercase tracking-wider">
                    Today&apos;s Workout
                  </p>
                  <h3 className="text-lg font-bold mt-1">{todayWorkout.focus}</h3>
                  <p className="text-sm text-text-tertiary">
                    {todayWorkout.exercises?.length ?? 0} exercises
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-forge-500/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-forge-400" />
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {todayWorkout.exercises?.slice(0, 3).map((ex, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-text-secondary">{ex.name}</span>
                    <span className="text-text-tertiary text-xs">
                      {(ex as { sets?: number }).sets ?? '?'} sets
                    </span>
                  </div>
                ))}
                {(todayWorkout.exercises?.length ?? 0) > 3 && (
                  <p className="text-xs text-text-tertiary">
                    +{(todayWorkout.exercises?.length ?? 0) - 3} more
                  </p>
                )}
              </div>

              <Link href="/workout">
                <Button fullWidth size="lg">
                  <Play className="w-4 h-4" />
                  Start Workout
                </Button>
              </Link>
            </Card>
          ) : program ? (
            <Card>
              <p className="text-text-secondary text-center py-4">
                Rest day — recovery is just as important! 💤
              </p>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-6 space-y-3">
                <p className="text-text-secondary">No workout program yet</p>
                <Link href="/onboarding">
                  <Button variant="secondary">Create Program</Button>
                </Link>
              </div>
            </Card>
          )}
        </FadeIn>

        {/* Muscle Recovery Map */}
        <FadeIn delay={0.3}>
          <Card>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Muscle Activity</h3>
              <span className="text-xs text-text-tertiary">This week</span>
            </div>
            <MuscleMapMini activeMuscles={weeklyStats.musclesWorked} />
          </Card>
        </FadeIn>

        {/* Recent Sessions */}
        <FadeIn delay={0.4}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Recent Sessions</h3>
            <Link
              href="/analytics"
              className="text-xs text-forge-400 flex items-center gap-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {recentSessions.length > 0 ? (
            <StaggerContainer className="space-y-2">
              {recentSessions.map((session) => (
                <StaggerItem key={session.id}>
                  <Card hover className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{session.name}</p>
                      <p className="text-xs text-text-tertiary">
                        {new Date(session.started_at).toLocaleDateString()}
                        {session.duration_minutes &&
                          ` · ${session.duration_minutes}min`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.status === 'completed' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent-green/10 text-accent-green">
                          Completed
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-text-tertiary" />
                    </div>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <Card>
              <p className="text-text-secondary text-center py-4 text-sm">
                No sessions yet. Start your first workout! 🚀
              </p>
            </Card>
          )}
        </FadeIn>

        {/* Program Info */}
        {program && (
          <FadeIn delay={0.5}>
            <Card className="bg-gradient-to-br from-surface-card to-surface-elevated">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-accent-purple" />
                <div>
                  <h3 className="font-semibold text-sm">{program.name}</h3>
                  <p className="text-xs text-text-tertiary">{program.goal}</p>
                </div>
              </div>
              <ProgressBar
                value={weeklyStats.workoutsCompleted}
                max={
                  (program.weekly_plan as { weeklyPlan: unknown[] })?.weeklyPlan
                    ?.length ?? 4
                }
                color="purple"
                showLabel
              />
            </Card>
          </FadeIn>
        )}
      </div>
    </AppShell>
  );
}
