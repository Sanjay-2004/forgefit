import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'forgefit-reminder';

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

export const DEFAULT_REMINDER: ReminderSettings = { enabled: false, hour: 20, minute: 0 };

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function loadReminder(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...DEFAULT_REMINDER, ...JSON.parse(raw) } : DEFAULT_REMINDER;
  } catch {
    return DEFAULT_REMINDER;
  }
}

/** Schedules (or cancels) the daily quest reminder. Returns false if permission was denied. */
export async function applyReminder(settings: ReminderSettings): Promise<boolean> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (settings.enabled) {
    const perm = await Notifications.getPermissionsAsync();
    const granted = perm.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) {
      await AsyncStorage.setItem(KEY, JSON.stringify({ ...settings, enabled: false }));
      return false;
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('daily-reminder', {
        name: 'Daily quest reminder',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚔️ The System is waiting',
        body: 'Your daily quests are not complete yet, Hunter. Do not break the streak.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.hour,
        minute: settings.minute,
        channelId: 'daily-reminder',
      },
    });
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
  return true;
}
