import { View, Text, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function SignUpScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!name || !email || !password) { Alert.alert('Fill in all fields'); return; }
    if (password.length < 8) { Alert.alert('Password must be at least 8 characters'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Sign up failed', error.message);
    } else {
      Alert.alert(
        'Check your email',
        'We sent a confirmation link. Verify it then come back to log in.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
      );
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg-primary"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={['#0f0f2e', '#0A0A1A']} className="items-center pt-20 pb-10 px-8">
          <Text className="text-5xl mb-2">🛡️</Text>
          <Text className="text-2xl font-bold text-text-primary tracking-wider mt-2">CREATE ACCOUNT</Text>
          <Text className="text-neon-cyan text-xs tracking-[0.3em] uppercase mt-1">Register as Hunter</Text>
        </LinearGradient>

        <View className="px-6 pb-12 bg-bg-primary flex-1">
          <TextInput
            className="bg-bg-secondary text-text-primary rounded-xl px-4 py-3.5 mb-3 border border-bg-tertiary"
            placeholder="Hunter name"
            placeholderTextColor="#64748B"
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
          />
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
            className="bg-bg-secondary text-text-primary rounded-xl px-4 py-3.5 mb-6 border border-bg-tertiary"
            placeholder="Password (min 8 characters)"
            placeholderTextColor="#64748B"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Pressable
            onPress={handleSignUp}
            disabled={loading}
            className="bg-neon-cyan rounded-2xl py-4 items-center active:opacity-80 mb-4"
          >
            <Text className="text-bg-primary font-bold text-base tracking-wider">
              {loading ? 'REGISTERING...' : 'REGISTER HUNTER'}
            </Text>
          </Pressable>
          <Pressable onPress={() => router.back()} className="items-center py-2">
            <Text className="text-text-secondary text-sm">
              Already registered?{' '}
              <Text className="text-accent-purple font-semibold">Sign in →</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
