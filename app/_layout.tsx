import '../src/styles/global.css';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/stores/app-store';
import type { Session } from '@supabase/supabase-js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 5 * 60 * 1000 },
  },
});

function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { setProfile, setLoading, isLoading } = useAppStore();
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Fetch profile to check onboarding
      loadProfile(session.user.id);
    } else if (session && !inAuthGroup && !useAppStore.getState().profile) {
      // Session exists but store is empty (e.g. hot reload) — reload data
      loadProfile(session.user.id);
    }
  }, [session, initialized, segments]);

  async function loadProfile(userId: string) {
    setLoading(true);
    const { setPreferences, setActiveProgram, setGamification } = useAppStore.getState();

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile) {
      setProfile(profile);

      // Load core data in parallel
      const [prefsResult, programResult, gamificationResult] = await Promise.all([
        supabase.from('user_preferences').select('*').eq('user_id', userId).single(),
        supabase.from('workout_programs').select('*').eq('user_id', userId).eq('is_active', true).single(),
        supabase.from('user_gamification').select('*').eq('user_id', userId).single(),
      ]);

      if (prefsResult.data) setPreferences(prefsResult.data);
      if (programResult.data) setActiveProgram(programResult.data);
      if (gamificationResult.data) setGamification(gamificationResult.data);

      if (!profile.onboarding_completed) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)/dashboard');
      }
    }
    setLoading(false);
  }

  if (!initialized || isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-primary">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0A0A1A' },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="workout/[id]" options={{ animation: 'slide_from_bottom' }} />
          </Stack>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
