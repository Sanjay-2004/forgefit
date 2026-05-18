import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo as reactUseMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/stores/app-store';
import type {
  Profile,
  UserPreferences,
  WorkoutProgram,
  WorkoutSession,
  ExerciseLog,
  PersonalRecord,
  UserGamification,
  Quest,
  CoachMessage,
  ProgressPhoto,
  UserGoalStats,
  WeeklyRecalibration,
  MuscleGroup,
} from '@/types';

function getUTCDateKey(dateInput: string): string {
  return new Date(dateInput).toISOString().split('T')[0];
}

function calculateStreakStats(orderedDateKeysDesc: string[]) {
  if (orderedDateKeysDesc.length === 0) {
    return { streakCount: 0, longestStreak: 0, lastWorkoutDate: null as string | null };
  }

  let streakCount = 1;
  for (let i = 1; i < orderedDateKeysDesc.length; i++) {
    const prev = new Date(`${orderedDateKeysDesc[i - 1]}T00:00:00Z`).getTime();
    const cur = new Date(`${orderedDateKeysDesc[i]}T00:00:00Z`).getTime();
    const diffDays = (prev - cur) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      streakCount += 1;
    } else {
      break;
    }
  }

  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < orderedDateKeysDesc.length; i++) {
    const prev = new Date(`${orderedDateKeysDesc[i - 1]}T00:00:00Z`).getTime();
    const cur = new Date(`${orderedDateKeysDesc[i]}T00:00:00Z`).getTime();
    const diffDays = (prev - cur) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      run += 1;
      longestStreak = Math.max(longestStreak, run);
    } else {
      run = 1;
    }
  }

  return {
    streakCount,
    longestStreak,
    lastWorkoutDate: orderedDateKeysDesc[0],
  };
}

async function computeUserStreakFromSessions(userId: string) {
  const { data: sessions, error } = await supabase
    .from('workout_sessions')
    .select('completed_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(365);

  if (error) throw error;

  const uniqueDateKeys = Array.from(
    new Set((sessions ?? []).map((s: any) => getUTCDateKey(s.completed_at))),
  );

  return calculateStreakStats(uniqueDateKeys);
}

// ============================================
// Profile & Preferences
// ============================================

export function useProfile() {
  const { profile } = useAppStore();
  return useQuery({
    queryKey: ['profile', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!profile?.id,
  });
}

export function usePreferences() {
  const { profile } = useAppStore();
  return useQuery({
    queryKey: ['preferences', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', profile.id)
        .single();
      if (error) throw error;
      return data as UserPreferences;
    },
    enabled: !!profile?.id,
  });
}

// ============================================
// Week Session Status Map (Mon–Sun)
// ============================================

/** Returns a map of date string → 'completed' | 'skipped' | null for the current Mon–Sun week */
export function useWeekSessionMap() {
  const { profile } = useAppStore();

  // Compute the Monday that starts the current week (Mon=0 … Sun=6)
  const monday = reactUseMemo(() => {
    const now = new Date();
    const jsDay = now.getDay(); // 0=Sun, 1=Mon ...
    const offset = jsDay === 0 ? -6 : 1 - jsDay;
    const mon = new Date(now);
    mon.setDate(now.getDate() + offset);
    mon.setHours(0, 0, 0, 0);
    return mon;
  }, []);

  return useQuery({
    queryKey: ['weekSessions', profile?.id, monday.toISOString()],
    queryFn: async () => {
      if (!profile?.id) return {} as Record<string, 'completed' | 'skipped' | null>;

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const { data: sessions, error } = await supabase
        .from('workout_sessions')
        .select('status, completed_at, started_at')
        .eq('user_id', profile.id)
        .gte('started_at', monday.toISOString())
        .lte('started_at', sunday.toISOString());

      if (error) throw error;

      const map: Record<string, 'completed' | 'skipped'> = {};
      for (const s of sessions ?? []) {
        const dateKey = (s.completed_at ?? s.started_at).split('T')[0];
        // A completed session wins over skipped for the same day
        if (s.status === 'completed' || !map[dateKey]) {
          map[dateKey] = s.status as 'completed' | 'skipped';
        }
      }
      return map;
    },
    enabled: !!profile?.id,
  });
}

// ============================================
// Workout Programs & Templates
// ============================================

export function useActiveProgram() {
  const { profile } = useAppStore();
  return useQuery({
    queryKey: ['activeProgram', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data, error } = await supabase
        .from('workout_programs')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return (data as WorkoutProgram) ?? null;
    },
    enabled: !!profile?.id,
  });
}

export function useWorkoutTemplates(programId?: string) {
  return useQuery({
    queryKey: ['templates', programId],
    queryFn: async () => {
      if (!programId) return [];
      const { data, error } = await supabase
        .from('workout_templates')
        .select('*')
        .eq('program_id', programId)
        .order('day_of_week');
      if (error) throw error;
      return data;
    },
    enabled: !!programId,
  });
}

// ============================================
// Workout Sessions & Exercise Logs
// ============================================

export function useRecentSessions(limit = 10) {
  const { profile } = useAppStore();
  return useQuery({
    queryKey: ['recentSessions', profile?.id, limit],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', profile.id)
        .order('started_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as WorkoutSession[];
    },
    enabled: !!profile?.id,
  });
}

export function useSessionLogs(sessionId?: string) {
  return useQuery({
    queryKey: ['sessionLogs', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at');
      if (error) throw error;
      return data as ExerciseLog[];
    },
    enabled: !!sessionId,
  });
}

// Fetch all unique muscles worked in the last 7 days for muscle map highlighting
export function useRecentMusclesWorked() {
  const { profile } = useAppStore();
  return useQuery({
    queryKey: ['recentMuscles', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('muscles_worked')
        .eq('user_id', profile.id)
        .gte('created_at', weekAgo);
      if (error) throw error;
      const allMuscles = (data ?? []).flatMap((row: any) => row.muscles_worked ?? []);
      return [...new Set(allMuscles)] as MuscleGroup[];
    },
    enabled: !!profile?.id,
  });
}

export function useSaveSession() {
  const queryClient = useQueryClient();
  const { profile } = useAppStore();

  return useMutation({
    mutationFn: async (session: {
      templateId?: string;
      programId?: string;
      name: string;
      focus?: string;
      status: 'completed' | 'skipped';
      durationMinutes: number;
      notes?: string;
      overallRpe?: number;
      mood?: string;
      xpEarned: number;
      exerciseLogs: {
        exerciseName: string;
        musclesWorked: string[];
        setNumber: number;
        weightKg: number | null;
        reps: number | null;
        rpe: number | null;
        isCompleted: boolean;
      }[];
    }) => {
      if (!profile?.id) throw new Error('Not authenticated');

      // Insert session
      const { data: sessionData, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: profile.id,
          template_id: session.templateId,
          program_id: session.programId,
          name: session.name,
          focus: session.focus,
          status: session.status,
          completed_at: new Date().toISOString(),
          duration_minutes: session.durationMinutes,
          notes: session.notes,
          overall_rpe: session.overallRpe,
          mood: session.mood,
          xp_earned: session.xpEarned,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Insert exercise logs
      if (session.exerciseLogs.length > 0) {
        const logs = session.exerciseLogs.map((log) => ({
          session_id: sessionData.id,
          user_id: profile.id,
          exercise_name: log.exerciseName,
          muscles_worked: log.musclesWorked,
          set_number: log.setNumber,
          weight_kg: log.weightKg,
          reps: log.reps,
          rpe: log.rpe,
          is_completed: log.isCompleted,
        }));
        await supabase.from('exercise_logs').insert(logs);

        // Auto-detect Personal Records (weight + volume)
        // Group logs by exercise to find best set this session
        const bestByExercise = new Map<
          string,
          { maxWeight: number; maxVolume: number }
        >();
        for (const log of session.exerciseLogs) {
          if (!log.isCompleted || log.weightKg == null || log.reps == null) continue;
          const volume = log.weightKg * log.reps;
          const existing = bestByExercise.get(log.exerciseName) ?? { maxWeight: 0, maxVolume: 0 };
          bestByExercise.set(log.exerciseName, {
            maxWeight: Math.max(existing.maxWeight, log.weightKg),
            maxVolume: Math.max(existing.maxVolume, volume),
          });
        }

        // Fetch existing PRs for these exercises
        const exerciseNames = Array.from(bestByExercise.keys());
        if (exerciseNames.length > 0) {
          const { data: existingPRs } = await supabase
            .from('personal_records')
            .select('exercise_name, record_type, value')
            .eq('user_id', profile.id)
            .in('exercise_name', exerciseNames);

          const prMap = new Map<string, number>();
          (existingPRs ?? []).forEach((pr: any) => {
            prMap.set(`${pr.exercise_name}::${pr.record_type}`, pr.value);
          });

          const newPRs: any[] = [];
          for (const [exerciseName, best] of bestByExercise) {
            const prevWeight = prMap.get(`${exerciseName}::weight`) ?? 0;
            const prevVolume = prMap.get(`${exerciseName}::volume`) ?? 0;
            if (best.maxWeight > prevWeight) {
              newPRs.push({
                user_id: profile.id,
                exercise_name: exerciseName,
                record_type: 'weight',
                value: best.maxWeight,
                previous_value: prevWeight || null,
              });
            }
            if (best.maxVolume > prevVolume) {
              newPRs.push({
                user_id: profile.id,
                exercise_name: exerciseName,
                record_type: 'volume',
                value: best.maxVolume,
                previous_value: prevVolume || null,
              });
            }
          }

          if (newPRs.length > 0) {
            await supabase.from('personal_records').insert(newPRs);
          }
        }
      }

      return sessionData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentSessions'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      queryClient.invalidateQueries({ queryKey: ['personalRecords'] });
      queryClient.invalidateQueries({ queryKey: ['recentMuscles'] });
    },
  });
}

// ============================================
// Gamification
// ============================================

export function useGamification() {
  const { profile } = useAppStore();
  return useQuery({
    queryKey: ['gamification', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', profile.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;

      const gamification = (data as UserGamification) ?? null;
      if (!gamification) return null;

      // Recompute from historical sessions so stale/incorrect counters self-heal.
      const streakStats = await computeUserStreakFromSessions(profile.id);
      const needsSync =
        gamification.streak_count !== streakStats.streakCount ||
        gamification.last_workout_date !== streakStats.lastWorkoutDate ||
        gamification.longest_streak < streakStats.longestStreak;

      if (needsSync) {
        const syncedLongest = Math.max(gamification.longest_streak, streakStats.longestStreak);
        await supabase
          .from('user_gamification')
          .update({
            streak_count: streakStats.streakCount,
            last_workout_date: streakStats.lastWorkoutDate,
            longest_streak: syncedLongest,
          })
          .eq('user_id', profile.id);

        return {
          ...gamification,
          streak_count: streakStats.streakCount,
          last_workout_date: streakStats.lastWorkoutDate,
          longest_streak: syncedLongest,
        } as UserGamification;
      }

      return gamification;
    },
    enabled: !!profile?.id,
  });
}

export function useQuests() {
  const { profile } = useAppStore();
  return useQuery({
    queryKey: ['quests', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Quest[];
    },
    enabled: !!profile?.id,
  });
}

export function useAddXP() {
  const queryClient = useQueryClient();
  const { profile } = useAppStore();

  return useMutation({
    mutationFn: async ({ amount, source, description, sessionId }: {
      amount: number;
      source: string;
      description: string;
      sessionId?: string;
    }) => {
      if (!profile?.id) throw new Error('Not authenticated');

      // Record transaction
      const { error: txnError } = await supabase.from('xp_transactions').insert({
        user_id: profile.id,
        amount,
        source,
        description,
        session_id: sessionId,
      });
      if (txnError) throw txnError;

      // Update total XP
      const { data: gamification, error: gamificationError } = await supabase
        .from('user_gamification')
        .select('xp_total, streak_count, longest_streak, last_workout_date')
        .eq('user_id', profile.id)
        .single();
      if (gamificationError) throw gamificationError;

      const newTotal = (gamification?.xp_total ?? 0) + amount;

      // Calculate new rank
      const ranks = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'National', 'World', 'Monarch'];
      const thresholds = [0, 500, 1500, 4000, 10000, 25000, 60000, 150000, 350000, 750000, 1500000];
      let newRank = 'E';
      for (let i = ranks.length - 1; i >= 0; i--) {
        if (newTotal >= thresholds[i]) { newRank = ranks[i]; break; }
      }

      const streakStats = await computeUserStreakFromSessions(profile.id);
      const longestStreak = Math.max(gamification?.longest_streak ?? 0, streakStats.longestStreak);

      const { error: updateError } = await supabase.from('user_gamification').update({
        xp_total: newTotal,
        current_rank: newRank,
        last_workout_date: streakStats.lastWorkoutDate,
        streak_count: streakStats.streakCount,
        longest_streak: longestStreak,
      }).eq('user_id', profile.id);
      if (updateError) throw updateError;

      // Also update local store immediately
      const { setGamification } = useAppStore.getState();
      const currentGam = useAppStore.getState().gamification;
      if (currentGam) {
        setGamification({
          ...currentGam,
          xp_total: newTotal,
          current_rank: newRank as any,
          last_workout_date: streakStats.lastWorkoutDate,
          streak_count: streakStats.streakCount,
          longest_streak: longestStreak,
        });
      }

      return { newTotal, newRank };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });
}

// ============================================
// Personal Records
// ============================================

export function usePersonalRecords() {
  const { profile } = useAppStore();
  return useQuery({
    queryKey: ['personalRecords', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', profile.id)
        .order('achieved_at', { ascending: false });
      if (error) throw error;
      return data as PersonalRecord[];
    },
    enabled: !!profile?.id,
  });
}

// ============================================
// Coach Messages
// ============================================

export function useCoachMessages() {
  const { profile } = useAppStore();
  return useQuery({
    queryKey: ['coachMessages', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('coach_messages')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: true })
        .limit(50);
      if (error) throw error;
      return data as CoachMessage[];
    },
    enabled: !!profile?.id,
  });
}

// ============================================
// Progress Photos
// ============================================

export function useProgressPhotos() {
  const { profile } = useAppStore();
  return useQuery({
    queryKey: ['progressPhotos', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('user_id', profile.id)
        .order('taken_at', { ascending: false });
      if (error) throw error;
      return data as ProgressPhoto[];
    },
    enabled: !!profile?.id,
  });
}

export function useUploadPhoto() {
  const queryClient = useQueryClient();
  const { profile } = useAppStore();

  return useMutation({
    mutationFn: async ({ uri, poseType, notes }: { uri: string; poseType: 'front' | 'side' | 'back'; notes?: string }) => {
      if (!profile?.id) throw new Error('Not authenticated');

      const fileName = `${profile.id}/${Date.now()}-${poseType}.jpg`;
      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, blob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName);

      await supabase.from('progress_photos').insert({
        user_id: profile.id,
        photo_url: urlData.publicUrl,
        pose_type: poseType,
        notes,
      });

      return urlData.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progressPhotos'] });
    },
  });
}

// ============================================
// Goal Stats
// ============================================

export function useGoalStats() {
  const { profile } = useAppStore();
  return useQuery({
    queryKey: ['goalStats', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('user_goal_stats')
        .select('*')
        .eq('user_id', profile.id);
      if (error) throw error;
      return data as UserGoalStats[];
    },
    enabled: !!profile?.id,
  });
}

// ============================================
// Weekly Recalibration
// ============================================

export function useWeeklyPlan() {
  const { profile } = useAppStore();
  return useQuery({
    queryKey: ['weeklyPlan', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data, error } = await supabase
        .from('weekly_plans')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return (data as WeeklyRecalibration) ?? null;
    },
    enabled: !!profile?.id,
  });
}

export function useTriggerRecalibration() {
  const queryClient = useQueryClient();
  const { profile } = useAppStore();

  return useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase.functions.invoke('weekly-recalibrate', {
        body: { userId: profile.id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklyPlan'] });
      queryClient.invalidateQueries({ queryKey: ['activeProgram'] });
    },
  });
}
