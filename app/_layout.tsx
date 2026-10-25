import '../src/styles/global.css';
import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text, Pressable } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '@/lib/supabase/client';
import { useUserStore } from '@/stores/user-store';
import { useChallengeStore } from '@/stores/challenge-store';
import { useDailyLogStore } from '@/stores/daily-log-store';
import type { Session } from '@supabase/supabase-js';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 5 * 60 * 1000 } },
});

function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { setUser, reset: resetUser, isLoading, setLoading } = useUserStore();
  const { setChallenge, reset: resetChallenge } = useChallengeStore();
  const resetLog = useDailyLogStore((s) => s.reset);
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Remember which user we've already loaded so token refreshes don't re-route the app
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setInitialized(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const inAuth = segments[0] === '(auth)';

    if (!session) {
      loadedFor.current = null;
      setLoadError(null);
      resetUser();
      resetChallenge();
      resetLog();
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }
    if (loadedFor.current !== session.user.id) {
      loadedFor.current = session.user.id;
      loadUserData(session);
    }
  }, [session, initialized]);

  async function loadUserData(s: Session) {
    setLoading(true);
    setLoadError(null);
    try {
      const base = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
      const headers = { Authorization: `Bearer ${s.access_token}`, 'Content-Type': 'application/json' };

      const userRes = await fetch(`${base}/api/user/me`, { headers });
      if (!userRes.ok) throw new Error(`Could not load user profile (${userRes.status})`);
      const user = await userRes.json();
      setUser({ userId: user._id, name: user.name, email: user.email, avatar: user.avatar, level: user.level, totalXP: user.totalXP, rank: user.rank });

      const challengeRes = await fetch(`${base}/api/challenge/active`, { headers });
      if (challengeRes.status === 404) {
        setChallenge(null);
        router.replace('/onboarding');
      } else if (challengeRes.ok) {
        setChallenge(await challengeRes.json());
        router.replace('/(tabs)' as any);
      } else {
        throw new Error(`Could not load challenge (${challengeRes.status})`);
      }
    } catch (err: any) {
      console.error('loadUserData:', err);
      // Offline / server down: fall back to the last known data if we have it.
      // Never send an existing user to onboarding just because the request failed.
      if (useUserStore.getState().userId && useChallengeStore.getState().challenge) {
        router.replace('/(tabs)' as any);
      } else {
        loadedFor.current = null;
        setLoadError(err?.message ?? 'Could not reach the server');
      }
    } finally {
      setLoading(false);
    }
  }

  const loading = !initialized || isLoading;

  if (loadError && session) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-primary px-8">
        <Text className="text-neon-cyan text-lg font-bold tracking-widest mb-2">CONNECTION LOST</Text>
        <Text className="text-text-secondary text-center mb-6">{loadError}</Text>
        <Pressable
          className="bg-accent-purple rounded-2xl py-3 px-8"
          onPress={() => { loadedFor.current = session.user.id; loadUserData(session); }}
        >
          <Text className="text-white font-bold tracking-wider">RETRY</Text>
        </Pressable>
        <Pressable className="mt-4" onPress={() => supabase.auth.signOut()}>
          <Text className="text-text-muted text-sm">Sign out</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      {children}
      {loading && (
        <View
          className="items-center justify-center bg-bg-primary"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <ActivityIndicator size="large" color="#00f0ff" />
          <Text className="text-text-secondary text-xs mt-3 tracking-[0.3em] uppercase">
            System Loading...
          </Text>
        </View>
      )}
    </>
  );
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
            <Stack.Screen name="edit-challenge" options={{ presentation: 'modal' }} />
            <Stack.Screen name="level-up" options={{ animation: 'fade', presentation: 'fullScreenModal' }} />
          </Stack>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
