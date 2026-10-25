import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import type { BonusChallenge } from '@/types';

interface BonusChallengeCardProps {
  challenge: BonusChallenge;
  onComplete: () => void;
  completing?: boolean;
}

export function BonusChallengeCard({ challenge, onComplete, completing = false }: BonusChallengeCardProps) {
  return (
    <View
      className={`rounded-2xl p-4 mb-3 border ${
        challenge.completed
          ? 'bg-accent-purple/10 border-accent-purple/30'
          : 'bg-bg-secondary border-neon-cyan/20'
      }`}
    >
      <View className="flex-row items-start justify-between mb-1">
        <Text className={`font-bold text-base flex-1 pr-2 ${challenge.completed ? 'text-text-muted line-through' : 'text-text-primary'}`}>
          {challenge.title}
        </Text>
        <View className="rounded-lg bg-neon-cyan/10 px-2 py-0.5 border border-neon-cyan/30">
          <Text className="text-neon-cyan text-xs font-bold">+{challenge.xpValue} XP</Text>
        </View>
      </View>
      <Text className={`text-sm leading-5 mb-3 ${challenge.completed ? 'text-text-muted' : 'text-text-secondary'}`}>
        {challenge.description}
      </Text>
      {!challenge.completed && (
        <Pressable
          onPress={onComplete}
          disabled={completing}
          className="bg-neon-cyan/10 rounded-xl py-2.5 items-center border border-neon-cyan/30 active:opacity-70"
        >
          {completing ? (
            <ActivityIndicator size="small" color="#00f0ff" />
          ) : (
            <Text className="text-neon-cyan font-semibold text-sm tracking-wider">COMPLETE QUEST</Text>
          )}
        </Pressable>
      )}
      {challenge.completed && (
        <View className="flex-row items-center">
          <Text className="text-accent-purple text-xs font-semibold">✓ Quest Completed</Text>
        </View>
      )}
    </View>
  );
}
