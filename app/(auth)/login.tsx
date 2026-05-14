import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useEffect } from 'react';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const redirectUrl = AuthSession.makeRedirectUri();

  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (data?.url) {
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
  }

  async function signInWithApple() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (data?.url) {
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
  }

  return (
    <View className="flex-1 bg-bg-primary">
      {/* Hero Section */}
      <View className="flex-1 items-center justify-center px-8">
        {/* Logo / Title */}
        <View className="items-center mb-4">
          <Text className="text-6xl font-bold text-accent-purple">⚔️</Text>
          <Text className="text-4xl font-bold text-text-primary mt-4 tracking-wider">
            FORGEFIT
          </Text>
          <Text className="text-lg text-accent-blue mt-2 tracking-widest uppercase">
            Arise, Hunter
          </Text>
        </View>

        {/* Tagline */}
        <Text className="text-text-secondary text-center text-base mt-6 leading-6">
          Every rep is XP. Every workout is a quest.{'\n'}Level up your body.
        </Text>
      </View>

      {/* Auth Buttons */}
      <View className="px-8 pb-12">
        <Pressable
          onPress={signInWithGoogle}
          className="flex-row items-center justify-center bg-white rounded-2xl py-4 px-6 mb-4 active:opacity-80"
        >
          <Ionicons name="logo-google" size={22} color="#4285F4" />
          <Text className="text-gray-800 font-semibold text-base ml-3">
            Continue with Google
          </Text>
        </Pressable>

        <Pressable
          onPress={signInWithApple}
          className="flex-row items-center justify-center bg-white rounded-2xl py-4 px-6 mb-4 active:opacity-80"
        >
          <Ionicons name="logo-apple" size={22} color="#000" />
          <Text className="text-gray-800 font-semibold text-base ml-3">
            Continue with Apple
          </Text>
        </Pressable>

        <Text className="text-text-muted text-center text-xs mt-4">
          By continuing, you agree to our Terms and Privacy Policy
        </Text>
      </View>
    </View>
  );
}
