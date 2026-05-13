'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/transitions';
import { LogOut, User, Settings, RefreshCw, Shield } from 'lucide-react';
import type { Profile, UserPreferences } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const [profileRes, prefsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single(),
    ]);

    setProfile(profileRes.data);
    setPreferences(prefsRes.data);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <AppShell>
      <div className="px-4 pt-12 pb-4 space-y-6">
        <FadeIn>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-forge-500 to-accent-purple flex items-center justify-center text-2xl font-bold text-white">
              {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <h1 className="text-xl font-bold">
                {profile?.full_name ?? 'Athlete'}
              </h1>
              <p className="text-sm text-text-tertiary">{profile?.email}</p>
            </div>
          </div>
        </FadeIn>

        {preferences && (
          <FadeIn delay={0.1}>
            <Card>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-forge-400" />
                Profile Details
              </h3>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Age', value: preferences.age },
                  { label: 'Height', value: preferences.height_cm ? `${preferences.height_cm} cm` : null },
                  { label: 'Weight', value: preferences.weight_kg ? `${preferences.weight_kg} kg` : null },
                  { label: 'Goal', value: preferences.fitness_goal?.replace(/_/g, ' ') },
                  { label: 'Level', value: preferences.experience_level },
                  { label: 'Equipment', value: preferences.equipment_access?.replace(/_/g, ' ') },
                  { label: 'Days/Week', value: preferences.workout_days_per_week },
                ].map(
                  (item) =>
                    item.value && (
                      <div
                        key={item.label}
                        className="flex justify-between py-1"
                      >
                        <span className="text-text-tertiary">{item.label}</span>
                        <span className="text-text-primary capitalize font-medium">
                          {String(item.value)}
                        </span>
                      </div>
                    )
                )}
              </div>
            </Card>
          </FadeIn>
        )}

        <FadeIn delay={0.2}>
          <div className="space-y-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => router.push('/onboarding')}
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate Program
            </Button>

            <Button variant="danger" fullWidth onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="text-center text-xs text-text-tertiary pt-4">
            ForgeFit v0.1.0 — Built with AI
          </p>
        </FadeIn>
      </div>
    </AppShell>
  );
}
