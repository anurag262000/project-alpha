import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/theme/ThemeProvider';

type Tab = 'home' | 'program' | 'progress' | 'profile';

const ITEMS: { key: Tab; icon: any; route: string }[] = [
  { key: 'home', icon: 'home-variant', route: '/home' },
  { key: 'program', icon: 'calendar-check', route: '/program' },
  { key: 'progress', icon: 'chart-line', route: '/progress' },
  { key: 'profile', icon: 'account', route: '/profile' },
];

export function BottomNav({ active }: { active: Tab | (string & {}) }) {
  const { theme } = useTheme();
  const router = useRouter();
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        height: 56,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.glassBorder,
      }}
    >
      <BlurView intensity={theme.blurIntensity} tint={theme.blurTint} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.glassBg }]} />
      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
        {ITEMS.map(({ key, icon, route }) => {
          const on = key === active;
          return (
            <Pressable
              key={key}
              onPress={() => !on && router.replace(route as any)}
              style={{ padding: 9, borderRadius: 12, backgroundColor: on ? theme.fillSoft : 'transparent' }}
            >
              <MaterialCommunityIcons name={icon} size={22} color={on ? theme.ink : theme.textMuted} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
