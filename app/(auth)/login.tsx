import { View, Text, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const redirectUrl = Linking.createURL('/');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'email' | 'google'>('email');

  async function signInWithEmail() {
    if (!email || !password) { Alert.alert('Enter email and password'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) Alert.alert('Login failed', error.message);
  }

  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
    });
    if (error || !data?.url) { Alert.alert('Google sign-in failed', error?.message); return; }
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    if (result.type === 'success') {
      const url = new URL(result.url);
      const params = new URLSearchParams(url.hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg-primary"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Hero */}
        <LinearGradient
          colors={['#0f0f2e', '#0A0A1A']}
          className="flex-1 items-center justify-center px-8 pt-20 pb-8"
        >
          <Text className="text-6xl mb-2">⚔️</Text>
          <Text className="text-4xl font-bold text-text-primary tracking-wider mt-2">FORGEFIT</Text>
          <Text className="text-neon-cyan text-sm tracking-[0.3em] uppercase mt-1">Arise, Hunter</Text>
          <Text className="text-text-secondary text-center text-sm mt-4 leading-6">
            Every rep is XP. Every quest completed{'\n'}brings you closer to S-Rank.
          </Text>
        </LinearGradient>

        {/* Auth section */}
        <View className="px-6 pb-12 bg-bg-primary">
          {/* Tab switch */}
          <View className="flex-row bg-bg-secondary rounded-2xl p-1 mb-6">
            {(['email', 'google'] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                className={`flex-1 py-2 rounded-xl items-center ${tab === t ? 'bg-accent-purple' : ''}`}
              >
                <Text className={`font-semibold text-sm ${tab === t ? 'text-white' : 'text-text-secondary'}`}>
                  {t === 'email' ? 'Email' : 'Google'}
                </Text>
              </Pressable>
            ))}
          </View>

          {tab === 'email' ? (
            <>
              <TextInput
                className="bg-bg-secondary text-text-primary rounded-xl px-4 py-3.5 mb-3 border border-bg-tertiary"
                placeholder="Email address"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                className="bg-bg-secondary text-text-primary rounded-xl px-4 py-3.5 mb-4 border border-bg-tertiary"
                placeholder="Password"
                placeholderTextColor="#64748B"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <Pressable
                onPress={signInWithEmail}
                disabled={loading}
                className="bg-accent-purple rounded-2xl py-4 items-center active:opacity-80 mb-4"
              >
                <Text className="text-white font-bold text-base tracking-wider">
                  {loading ? 'ENTERING SYSTEM...' : 'ENTER THE SYSTEM'}
                </Text>
              </Pressable>
              <Pressable onPress={() => router.push('/(auth)/sign-up' as any)} className="items-center py-2">
                <Text className="text-text-secondary text-sm">
                  No account?{' '}
                  <Text className="text-neon-cyan font-semibold">Create one →</Text>
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={signInWithGoogle}
              className="flex-row items-center justify-center bg-white rounded-2xl py-4 px-6 active:opacity-80"
            >
              <Ionicons name="logo-google" size={22} color="#4285F4" />
              <Text className="text-gray-800 font-semibold text-base ml-3">Continue with Google</Text>
            </Pressable>
          )}

          <Text className="text-text-muted text-center text-xs mt-6">
            By continuing you agree to our Terms & Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
