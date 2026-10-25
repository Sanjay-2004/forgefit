import {
  View, Text, Pressable, ScrollView, TextInput, Switch,
  ActivityIndicator, Alert, FlatList, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useChallengeStore } from '@/stores/challenge-store';
import { createChallenge } from '@/api/challenge';
import { CHALLENGE_DURATIONS } from '@/types';
import { toLocalDateString } from '@/lib/utils';
import type { Target } from '@/types';

// ---- Step 0: Cinematic intro ----
function IntroStep({ onNext }: { onNext: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className="items-center"
      >
        <Text className="text-7xl mb-6">⚔️</Text>
        <Text className="text-3xl font-bold text-neon-cyan text-center tracking-widest uppercase">
          System Detected
        </Text>
        <Text className="text-xl font-bold text-text-primary text-center mt-2 tracking-wider">
          A New Hunter
        </Text>
        <Text className="text-text-secondary text-center mt-6 leading-7 text-base">
          "The system has recognized you.{'\n'}Your ascension begins now."
        </Text>
        <Text className="text-text-muted text-center mt-4 text-sm leading-6">
          Complete 75 Hard daily quests, earn XP,{'\n'}level up, and achieve S-Rank status.
        </Text>
      </MotiView>
      <Pressable
        onPress={onNext}
        className="mt-16 bg-accent-purple rounded-2xl py-4 px-12 active:opacity-80"
      >
        <Text className="text-white font-bold text-base tracking-widest uppercase">Arise</Text>
      </Pressable>
    </View>
  );
}

// ---- Step 1: Duration ----
function DurationStep() {
  const { data, updateData } = useOnboardingStore();
  return (
    <View className="flex-1 px-6">
      <Text className="text-2xl font-bold text-text-primary mb-2 tracking-wider">Challenge Duration</Text>
      <Text className="text-text-secondary mb-8">How many days is your quest?</Text>
      <View className="flex-row flex-wrap gap-3">
        {CHALLENGE_DURATIONS.map((d) => (
          <Pressable
            key={d}
            onPress={() => { Haptics.selectionAsync(); updateData({ durationDays: d }); }}
            className={`rounded-2xl py-5 items-center justify-center ${
              data.durationDays === d
                ? 'bg-accent-purple border-2 border-neon-cyan'
                : 'bg-bg-secondary border border-bg-tertiary'
            }`}
            style={{ width: '30%' }}
          >
            <Text className={`text-2xl font-bold ${data.durationDays === d ? 'text-white' : 'text-text-primary'}`}>
              {d}
            </Text>
            <Text className={`text-xs mt-1 ${data.durationDays === d ? 'text-neon-cyan' : 'text-text-muted'}`}>days</Text>
          </Pressable>
        ))}
      </View>
      {data.durationDays === 75 && (
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 bg-bg-secondary rounded-xl p-4 border border-accent-purple/30">
          <Text className="text-accent-purple text-xs font-semibold tracking-wider">⚡ THE ORIGINAL PROTOCOL</Text>
          <Text className="text-text-secondary text-sm mt-1">The classic 75 Hard — the benchmark every hunter measures themselves against.</Text>
        </MotiView>
      )}
    </View>
  );
}

// ---- Step 2: Start date ----
function parseLocalDate(s?: string): Date {
  if (!s) return new Date();
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function StartDateStep() {
  const { data, updateData } = useOnboardingStore();
  const [show, setShow] = useState(Platform.OS === 'ios');
  const value = parseLocalDate(data.startDate);
  const today = parseLocalDate(toLocalDateString());
  const isToday = toLocalDateString(value) === toLocalDateString(today);

  function onChange(_e: unknown, selected?: Date) {
    if (Platform.OS === 'android') setShow(false);
    if (selected) updateData({ startDate: toLocalDateString(selected) });
  }

  return (
    <View className="flex-1 px-6">
      <Text className="text-2xl font-bold text-text-primary mb-2 tracking-wider">Start Date</Text>
      <Text className="text-text-secondary mb-6">When does your quest begin?</Text>
      <Pressable
        onPress={() => setShow(true)}
        className="bg-bg-secondary rounded-2xl py-5 items-center border-2 border-neon-cyan"
      >
        <Text className="text-neon-cyan text-2xl font-bold">
          {value.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
        <Text className="text-text-muted text-xs mt-1">{isToday ? 'Starting today' : 'Tap to change'}</Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          themeVariant="dark"
          minimumDate={today}
          onChange={onChange}
        />
      )}
    </View>
  );
}

// ---- Step 3: Water Target ----
function WaterStep() {
  const { data, updateData } = useOnboardingStore();
  return (
    <View className="flex-1 px-6">
      <Text className="text-2xl font-bold text-text-primary mb-2 tracking-wider">Daily Hydration</Text>
      <Text className="text-text-secondary mb-8">Set your water intake target.</Text>
      <View className="flex-row gap-4">
        {([3, 4] as const).map((liters) => (
          <Pressable
            key={liters}
            onPress={() => { Haptics.selectionAsync(); updateData({ waterTarget: liters }); }}
            className={`flex-1 rounded-2xl py-8 items-center border-2 ${
              data.waterTarget === liters ? 'bg-bg-secondary border-neon-cyan' : 'bg-bg-secondary border-bg-tertiary'
            }`}
          >
            <Text className="text-4xl">💧</Text>
            <Text className={`text-3xl font-bold mt-2 ${data.waterTarget === liters ? 'text-neon-cyan' : 'text-text-primary'}`}>
              {liters}L
            </Text>
            <Text className={`text-sm mt-1 ${data.waterTarget === liters ? 'text-neon-cyan' : 'text-text-muted'}`}>
              {liters === 3 ? 'Standard' : 'Advanced'}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text className="text-text-muted text-center text-xs mt-6">Water intake is tracked separately from your daily quests.</Text>
    </View>
  );
}

// ---- Step 4: Daily Targets ----
function TargetsStep() {
  const { data, updateData } = useOnboardingStore();
  const targets = data.dailyTargets ?? [];
  const [newName, setNewName] = useState('');
  const [newXP, setNewXP] = useState('10');

  function updateXP(idx: number, val: string) {
    const xp = Math.max(1, Math.min(100, Number(val) || 1));
    const updated = targets.map((t, i) => i === idx ? { ...t, xpValue: xp } : t);
    updateData({ dailyTargets: updated });
  }

  function addTarget() {
    if (!newName.trim()) return;
    const updated = [...targets, { name: newName.trim(), type: 'custom' as const, xpValue: Number(newXP) || 10, order: targets.length }];
    updateData({ dailyTargets: updated });
    setNewName(''); setNewXP('10');
  }

  function removeTarget(idx: number) {
    updateData({ dailyTargets: targets.filter((_, i) => i !== idx) });
  }

  return (
    <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
      <Text className="text-2xl font-bold text-text-primary mb-2 tracking-wider">Daily Quests</Text>
      <Text className="text-text-secondary mb-6">Edit XP values or add custom quests.</Text>
      {targets.map((t, idx) => (
        <View key={idx} className="flex-row items-center bg-bg-secondary rounded-xl px-4 py-3 mb-2 border border-bg-tertiary">
          <View className="flex-1">
            <Text className="text-text-primary text-sm font-medium">{t.name}</Text>
          </View>
          <TextInput
            className="bg-bg-primary text-neon-cyan rounded-lg px-2 py-1 w-12 text-center text-sm font-bold"
            keyboardType="number-pad"
            value={String(t.xpValue)}
            onChangeText={(v) => updateXP(idx, v)}
          />
          <Text className="text-text-muted text-xs ml-1 mr-2">XP</Text>
          <Pressable onPress={() => removeTarget(idx)} className="p-1">
            <Text className="text-red-500 text-lg">×</Text>
          </Pressable>
        </View>
      ))}
      <View className="flex-row items-center gap-2 mt-4">
        <TextInput
          className="flex-1 bg-bg-secondary text-text-primary rounded-xl px-4 py-3 border border-bg-tertiary text-sm"
          placeholder="Custom quest name..."
          placeholderTextColor="#64748B"
          value={newName}
          onChangeText={setNewName}
        />
        <TextInput
          className="bg-bg-secondary text-neon-cyan rounded-xl px-3 py-3 border border-bg-tertiary w-16 text-center text-sm font-bold"
          keyboardType="number-pad"
          placeholder="XP"
          placeholderTextColor="#64748B"
          value={newXP}
          onChangeText={setNewXP}
        />
        <Pressable onPress={addTarget} className="bg-accent-purple rounded-xl px-4 py-3 active:opacity-80">
          <Text className="text-white font-bold">+</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ---- Main Onboarding Screen ----
const STEP_TITLES = ['', 'Duration', 'Start Date', 'Hydration', 'Daily Quests', 'Confirm'];
const LAST_STEP = 5;

export default function OnboardingScreen() {
  const router = useRouter();
  const { currentStep, nextStep, prevStep, data, reset } = useOnboardingStore();
  const { setChallenge } = useChallengeStore();
  const [submitting, setSubmitting] = useState(false);

  async function handleFinish() {
    if (!data.durationDays || !data.startDate || !data.waterTarget || !data.dailyTargets?.length) {
      Alert.alert('Incomplete', 'Please fill in all steps first.');
      return;
    }
    setSubmitting(true);
    try {
      const challenge = await createChallenge({
        durationDays: data.durationDays!,
        startDate: data.startDate!,
        waterTarget: data.waterTarget!,
        dailyTargets: data.dailyTargets!,
      });
      setChallenge(challenge);
      reset();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not start challenge');
    } finally {
      setSubmitting(false);
    }
  }

  const isLastStep = currentStep === LAST_STEP;
  const progress = (currentStep / LAST_STEP) * 100;

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      {/* Progress bar */}
      {currentStep > 0 && (
        <View className="h-1 bg-bg-secondary mx-6 mt-2 rounded-full overflow-hidden">
          <MotiView
            animate={{ width: `${progress}%` as any }}
            transition={{ type: 'timing', duration: 300 }}
            className="h-full bg-accent-purple rounded-full"
          />
        </View>
      )}

      {/* Step label */}
      {currentStep > 0 && (
        <View className="flex-row items-center justify-between px-6 py-4">
          <Text className="text-text-muted text-xs tracking-widest uppercase">
            Step {currentStep} of {LAST_STEP}
          </Text>
          <Text className="text-text-muted text-xs tracking-widest uppercase">
            {STEP_TITLES[currentStep]}
          </Text>
        </View>
      )}

      {/* Step content */}
      <View className="flex-1">
        {currentStep === 0 && <IntroStep onNext={nextStep} />}
        {currentStep === 1 && <DurationStep />}
        {currentStep === 2 && <StartDateStep />}
        {currentStep === 3 && <WaterStep />}
        {currentStep === 4 && <TargetsStep />}
        {currentStep === 5 && (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-6xl mb-4">🏆</Text>
            <Text className="text-2xl font-bold text-text-primary tracking-wider text-center">Ready to Ascend?</Text>
            <Text className="text-text-secondary text-center mt-4 leading-7">
              {data.durationDays}-day challenge · {data.waterTarget}L water daily{'\n'}
              Starts {data.startDate}{'\n'}
              {data.dailyTargets?.length ?? 0} daily quests configured
            </Text>
            <Text className="text-neon-cyan text-center mt-3 text-sm italic">
              "The system is ready. Are you?"
            </Text>
          </View>
        )}
      </View>

      {/* Nav buttons */}
      {currentStep > 0 && (
        <View className="flex-row gap-3 px-6 pb-8">
          <Pressable
            onPress={prevStep}
            className="flex-1 bg-bg-secondary rounded-2xl py-4 items-center border border-bg-tertiary active:opacity-70"
          >
            <Text className="text-text-secondary font-semibold">Back</Text>
          </Pressable>
          <Pressable
            onPress={isLastStep ? handleFinish : nextStep}
            disabled={submitting}
            className="flex-2 bg-accent-purple rounded-2xl py-4 px-8 items-center active:opacity-80"
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold tracking-wider">
                {isLastStep ? 'START QUEST ⚔️' : 'Next →'}
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

