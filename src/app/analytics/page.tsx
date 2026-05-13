'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { CardSkeleton } from '@/components/ui/skeleton';
import { FadeIn } from '@/components/ui/transitions';
import { MuscleMap } from '@/components/muscle-map/muscle-map';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Award, Target, Activity, Trophy } from 'lucide-react';
import type { MuscleGroup, PersonalRecord, WorkoutSession } from '@/types';

interface VolumeByDay {
  date: string;
  volume: number;
}

interface MuscleVolume {
  muscle: string;
  volume: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeByDay[]>([]);
  const [muscleVolume, setMuscleVolume] = useState<MuscleVolume[]>([]);
  const [workedMuscles, setWorkedMuscles] = useState<MuscleGroup[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const [sessionsRes, prsRes, logsRes] = await Promise.all([
      supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('started_at', thirtyDaysAgo)
        .order('started_at'),
      supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', user.id)
        .order('achieved_at', { ascending: false })
        .limit(10),
      supabase
        .from('exercise_logs')
        .select('muscles_worked, weight_kg, reps, created_at')
        .eq('user_id', user.id)
        .eq('is_completed', true)
        .gte('created_at', thirtyDaysAgo),
    ]);

    setSessions(sessionsRes.data ?? []);
    setPrs(prsRes.data ?? []);

    // Volume by day
    const volByDay: Record<string, number> = {};
    const muscleVol: Record<string, number> = {};
    const allMuscles = new Set<MuscleGroup>();

    (logsRes.data ?? []).forEach((log) => {
      const day = new Date(log.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const vol = (log.weight_kg ?? 0) * (log.reps ?? 0);
      volByDay[day] = (volByDay[day] ?? 0) + vol;

      (log.muscles_worked as MuscleGroup[])?.forEach((m) => {
        muscleVol[m] = (muscleVol[m] ?? 0) + vol;
        allMuscles.add(m);
      });
    });

    setVolumeData(
      Object.entries(volByDay).map(([date, volume]) => ({ date, volume }))
    );
    setMuscleVolume(
      Object.entries(muscleVol)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([muscle, volume]) => ({
          muscle: muscle.replace(/_/g, ' '),
          volume,
        }))
    );
    setWorkedMuscles(Array.from(allMuscles));

    setLoading(false);
  }

  const customTooltipStyle = {
    backgroundColor: '#1A1A25',
    border: '1px solid #2A2A3A',
    borderRadius: '12px',
    padding: '8px 12px',
    color: '#F5F5F7',
    fontSize: '12px',
  };

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
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-text-tertiary text-sm">Last 30 days</p>
        </FadeIn>

        {/* Summary Stats */}
        <FadeIn delay={0.1}>
          <div className="grid grid-cols-2 gap-3">
            <Card className="text-center">
              <Activity className="w-5 h-5 text-forge-400 mx-auto mb-1" />
              <p className="text-2xl font-bold">{sessions.length}</p>
              <p className="text-xs text-text-tertiary">Workouts</p>
            </Card>
            <Card className="text-center">
              <Award className="w-5 h-5 text-accent-yellow mx-auto mb-1" />
              <p className="text-2xl font-bold">{prs.length}</p>
              <p className="text-xs text-text-tertiary">PRs Set</p>
            </Card>
          </div>
        </FadeIn>

        {/* Volume Chart */}
        <FadeIn delay={0.2}>
          <Card>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-forge-400" />
              Training Volume
            </h3>
            {volumeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3A" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#5A5A6E', fontSize: 10 }}
                    axisLine={{ stroke: '#2A2A3A' }}
                  />
                  <YAxis
                    tick={{ fill: '#5A5A6E', fontSize: 10 }}
                    axisLine={{ stroke: '#2A2A3A' }}
                  />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="volume"
                    stroke="#0c93e9"
                    strokeWidth={2}
                    dot={{ fill: '#0c93e9', r: 3 }}
                    activeDot={{ r: 5, fill: '#36adf8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-text-tertiary py-8 text-sm">
                Complete workouts to see volume trends
              </p>
            )}
          </Card>
        </FadeIn>

        {/* Muscle Volume */}
        <FadeIn delay={0.3}>
          <Card>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-accent-purple" />
              Volume by Muscle
            </h3>
            {muscleVolume.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={muscleVolume} layout="vertical">
                  <XAxis
                    type="number"
                    tick={{ fill: '#5A5A6E', fontSize: 10 }}
                    axisLine={{ stroke: '#2A2A3A' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="muscle"
                    tick={{ fill: '#8E8EA0', fontSize: 10 }}
                    axisLine={{ stroke: '#2A2A3A' }}
                    width={80}
                  />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Bar dataKey="volume" fill="#7C4DFF" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-text-tertiary py-8 text-sm">
                No data yet
              </p>
            )}
          </Card>
        </FadeIn>

        {/* Muscle Map */}
        <FadeIn delay={0.4}>
          <Card>
            <h3 className="font-semibold mb-3">Muscle Engagement</h3>
            <MuscleMap activeMuscles={workedMuscles} showLabels size="md" />
          </Card>
        </FadeIn>

        {/* Recent PRs */}
        <FadeIn delay={0.5}>
          <Card>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-accent-yellow" />
              Recent PRs
            </h3>
            {prs.length > 0 ? (
              <div className="space-y-2">
                {prs.map((pr) => (
                  <div
                    key={pr.id}
                    className="flex justify-between items-center py-2 border-b border-surface-border last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{pr.exercise_name}</p>
                      <p className="text-xs text-text-tertiary">
                        {new Date(pr.achieved_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-accent-green">
                        {pr.value}
                        {pr.record_type === 'weight' ? 'kg' : ''}
                      </p>
                      {pr.previous_value && (
                        <p className="text-xs text-text-tertiary">
                          prev: {pr.previous_value}
                          {pr.record_type === 'weight' ? 'kg' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-text-tertiary py-4 text-sm">
                Hit the gym and set some records! 💪
              </p>
            )}
          </Card>
        </FadeIn>
      </div>
    </AppShell>
  );
}
