import { ScrollView, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Glass, Cap } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';

const ONBOARDING = [
  ['welcome', 'Welcome'],
  ['basics', 'Basics'],
  ['activity', 'Activity'],
  ['goal', 'Goal'],
  ['experience', 'Experience'],
  ['schedule', 'Schedule'],
  ['equipment', 'Equipment'],
  ['health', 'Health'],
  ['ready', 'Plan ready'],
] as const;

export default function Launcher() {
  const router = useRouter();
  const { theme, name, toggle } = useTheme();

  return (
    <Screen ambient="default">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <View>
          <Text style={{ fontSize: 20, fontWeight: '700', letterSpacing: -0.4, color: theme.textPrimary }}>
            project · alpha
          </Text>
          <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>Prototype · pick a screen</Text>
        </View>
        <Pressable
          onPress={toggle}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 20,
            backgroundColor: theme.fieldBg,
            borderWidth: 1,
            borderColor: theme.glassBorder,
          }}
        >
          <MaterialCommunityIcons
            name={name === 'dark' ? 'white-balance-sunny' : 'moon-waning-crescent'}
            size={16}
            color={theme.textPrimary}
          />
          <Text style={{ fontSize: 13, fontWeight: '500', color: theme.textPrimary }}>
            {name === 'dark' ? 'Light' : 'Dark'}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={{ marginTop: 20 }} showsVerticalScrollIndicator={false}>
        <Cap>Onboarding</Cap>
        <Glass style={{ marginTop: 10, paddingHorizontal: 14 }}>
          {ONBOARDING.map(([slug, label], i) => (
            <Pressable
              key={slug}
              onPress={() => router.push(`/onboarding/${slug}` as any)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 14,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: theme.hairline,
              }}
            >
              <Text style={{ fontSize: 15, color: theme.textPrimary }}>{label}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textDisabled} />
            </Pressable>
          ))}
        </Glass>
        <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 16 }}>
          App screens (home, logging, progress…) come next.
        </Text>
        <View style={{ height: 30 }} />
      </ScrollView>
    </Screen>
  );
}
