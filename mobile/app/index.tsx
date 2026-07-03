import { ScrollView, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Glass, Cap } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';

const ONBOARDING: [string, string][] = [
  ['/onboarding/welcome', 'Welcome'],
  ['/onboarding/basics', 'Basics'],
  ['/onboarding/activity', 'Activity'],
  ['/onboarding/goal', 'Goal'],
  ['/onboarding/experience', 'Experience'],
  ['/onboarding/schedule', 'Schedule'],
  ['/onboarding/equipment', 'Equipment'],
  ['/onboarding/health', 'Health'],
  ['/onboarding/ready', 'Plan ready'],
];

const APP: [string, string][] = [
  ['/home', 'Home'],
  ['/program', 'Program'],
  ['/library', 'Library'],
  ['/logging', 'Logging'],
  ['/summary', 'Summary'],
  ['/progress', 'Progress'],
  ['/profile', 'Profile'],
];

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
          {ONBOARDING.map(([route, label], i) => (
            <Row key={route} route={route} label={label} first={i === 0} />
          ))}
        </Glass>

        <Cap style={{ marginTop: 20 }}>App</Cap>
        <Glass style={{ marginTop: 10, paddingHorizontal: 14 }}>
          {APP.map(([route, label], i) => (
            <Row key={route} route={route} label={label} first={i === 0} />
          ))}
        </Glass>
        <View style={{ height: 30 }} />
      </ScrollView>
    </Screen>
  );
}

function Row({ route, label, first }: { route: string; label: string; first: boolean }) {
  const router = useRouter();
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={() => router.push(route as any)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: theme.hairline,
      }}
    >
      <Text style={{ fontSize: 15, color: theme.textPrimary }}>{label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textDisabled} />
    </Pressable>
  );
}
