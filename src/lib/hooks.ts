import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
} from '@/types';

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
        .single();
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
      }

      return sessionData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentSessions'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
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
      return (data as UserGamification) ?? null;
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
      await supabase.from('xp_transactions').insert({
        user_id: profile.id,
        amount,
        source,
        description,
        session_id: sessionId,
      });

      // Update total XP
      const { data: gamification } = await supabase
        .from('user_gamification')
        .select('xp_total')
        .eq('user_id', profile.id)
        .single();

      const newTotal = (gamification?.xp_total ?? 0) + amount;

      // Calculate new rank
      const ranks = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'National', 'World', 'Monarch'];
      const thresholds = [0, 500, 1500, 4000, 10000, 25000, 60000, 150000, 350000, 750000, 1500000];
      let newRank = 'E';
      for (let i = ranks.length - 1; i >= 0; i--) {
        if (newTotal >= thresholds[i]) { newRank = ranks[i]; break; }
      }

      await supabase.from('user_gamification').update({
        xp_total: newTotal,
        current_rank: newRank,
      }).eq('user_id', profile.id);

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
