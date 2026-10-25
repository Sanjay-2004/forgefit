import { View, Text } from 'react-native';
import type { CalendarDay } from '@/types';

interface ProgressCalendarProps {
  days: CalendarDay[];
  totalDays: number;
}

export function ProgressCalendar({ days, totalDays }: ProgressCalendarProps) {
  const dayMap = new Map(days.map((d) => [d.dayNumber, d]));

  return (
    <View>
      <View className="flex-row flex-wrap gap-1.5">
        {Array.from({ length: totalDays }).map((_, i) => {
          const dayNum = i + 1;
          const log = dayMap.get(dayNum);
          const isCompleted = log?.allCompleted;
          const hasLog = !!log;

          return (
            <View
              key={dayNum}
              className={`w-7 h-7 rounded-md items-center justify-center ${
                isCompleted
                  ? 'bg-accent-purple'
                  : hasLog
                  ? 'bg-bg-tertiary border border-red-500/40'
                  : 'bg-bg-secondary'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  isCompleted ? 'text-white' : hasLog ? 'text-red-400' : 'text-text-muted'
                }`}
              >
                {dayNum}
              </Text>
            </View>
          );
        })}
      </View>
      <View className="flex-row gap-4 mt-4">
        <View className="flex-row items-center gap-1.5">
          <View className="w-3 h-3 rounded-sm bg-accent-purple" />
          <Text className="text-text-muted text-xs">Complete</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-3 h-3 rounded-sm bg-bg-tertiary border border-red-500/40" />
          <Text className="text-text-muted text-xs">Incomplete</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-3 h-3 rounded-sm bg-bg-secondary" />
          <Text className="text-text-muted text-xs">Upcoming</Text>
        </View>
      </View>
    </View>
  );
}
