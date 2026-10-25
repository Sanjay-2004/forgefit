import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface DayCounterProps {
  dayNumber: number;
  totalDays: number;
}

export function DayCounter({ dayNumber, totalDays }: DayCounterProps) {
  const size = 90;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, (dayNumber - 1) / totalDays);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View className="items-center">
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1A1A3A"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#00f0ff"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-2xl font-bold text-text-primary">{dayNumber}</Text>
        </View>
      </View>
      <Text className="text-text-muted text-xs mt-1 tracking-widest uppercase">
        Day of {totalDays}
      </Text>
    </View>
  );
}
