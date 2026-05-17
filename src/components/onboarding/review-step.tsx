import { View, Text } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding-store';

export function ReviewStep() {
  const { data } = useOnboardingStore();

  return (
    <View className="mt-8">
      <Text className="text-text-primary text-2xl font-bold">Ready to Arise?</Text>
      <Text className="text-text-secondary text-base mt-2 mb-8">
        Review your profile. Your AI-powered training program will be generated based on this.
      </Text>

      <View className="bg-bg-card rounded-2xl p-5 mb-4">
        <Text className="text-text-muted text-xs uppercase tracking-widest font-bold mb-3">
          Hunter Profile
        </Text>
        <ReviewRow label="Age" value={data.age?.toString()} />
        <ReviewRow label="Sex" value={data.sex} />
        <ReviewRow label="Height" value={data.height_cm ? `${data.height_cm} cm` : undefined} />
        <ReviewRow label="Weight" value={data.weight_kg ? `${data.weight_kg} kg` : undefined} />
      </View>

      <View className="bg-bg-card rounded-2xl p-5 mb-4">
        <Text className="text-text-muted text-xs uppercase tracking-widest font-bold mb-3">
          Training Config
        </Text>
        <ReviewRow label="Goals" value={data.fitness_goals?.map((g) => g.replace(/_/g, ' ')).join(', ')} />
        <ReviewRow label="Experience" value={data.experience_level} />
        <ReviewRow label="Equipment" value={data.equipment_access?.map((e) => e.replace(/_/g, ' ')).join(', ')} />
        <ReviewRow label="Location" value={data.training_location} />
        <ReviewRow label="Styles" value={data.preferred_styles?.join(', ')} />
        <ReviewRow label="Days/Week" value={data.workout_days_per_week?.toString()} />
        <ReviewRow label="Session" value={data.session_duration_minutes ? `${data.session_duration_minutes} min` : undefined} />
      </View>

      <View className="bg-bg-card rounded-2xl p-5 mb-4">
        <Text className="text-text-muted text-xs uppercase tracking-widest font-bold mb-3">
          Lifestyle
        </Text>
        <ReviewRow label="Activity" value={data.activity_level?.replace(/_/g, ' ')} />
        <ReviewRow label="Sleep" value={data.sleep_quality} />
        <ReviewRow label="Stress" value={data.stress_level?.replace(/_/g, ' ')} />
        <ReviewRow label="Motivation" value={data.dopamine_type} />
      </View>

      {data.injuries ? (
        <View className="bg-bg-card rounded-2xl p-5 mb-4">
          <Text className="text-text-muted text-xs uppercase tracking-widest font-bold mb-3">
            Injuries
          </Text>
          <Text className="text-text-secondary text-sm">{data.injuries}</Text>
        </View>
      ) : null}

      <View className="bg-accent-purple/10 rounded-2xl p-5 mb-8 border border-accent-purple/30">
        <Text className="text-accent-purple font-bold text-sm">⚔️ What happens next?</Text>
        <Text className="text-text-secondary text-sm mt-2 leading-5">
          Our AI will analyze your profile and generate a personalized weekly training program.
          You&apos;ll start at Hunter Rank E and earn XP with every set you complete.
        </Text>
      </View>
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  return (
    <View className="flex-row items-start py-2 border-b border-bg-tertiary">
      <Text className="text-text-secondary text-sm flex-1 pr-3">{label}</Text>
      <Text
        className="text-text-primary text-sm font-medium capitalize flex-1 text-right"
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {value || '—'}
      </Text>
    </View>
  );
}
