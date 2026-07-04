import { useCallback, useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Glass, Cap } from '@/components/ui';
import { BottomNav } from '@/components/BottomNav';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/store/auth';
import { getProfile, latestMeasurement } from '@/db/profileRepo';
import { recentSessions } from '@/db/workoutRepo';
import type { Profile as ProfileRow } from '@/db/schema';

const GOAL_LABEL: Record<string, string> = {
  fat_loss: 'Fat loss',
  muscle_gain: 'Muscle gain',
  recomp: 'Recomp',
  general_fitness: 'General fitness',
};
const EXP_LABEL: Record<string, string> = {
  new: 'New',
  under_1yr: '<1 yr',
  '1_3yr': '1–3 yrs',
  '3yr_plus': '3+ yrs',
};

export default function Profile() {
  const router = useRouter();
  const { theme, name, toggle } = useTheme();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);

  const [row, setRow] = useState<ProfileRow | null>(null);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [workouts, setWorkouts] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getProfile().then(async (p) => {
        setRow(p);
        if (p) {
          const m = await latestMeasurement(p.id);
          setWeightKg(m?.weightKg ?? null);
          setWorkouts((await recentSessions(p.id, 1000)).length);
        }
      });
    }, [])
  );

  const initials = (user?.email ?? '?').slice(0, 2).toUpperCase();

  const doSignOut = async () => {
    await signOut();
    router.replace('/onboarding/welcome');
  };

  const Row = ({
    icon,
    label,
    right,
    onPress,
  }: {
    icon: any;
    label: string;
    right: React.ReactNode;
    onPress?: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderTopWidth: 1, borderTopColor: theme.hairline }}
    >
      <MaterialCommunityIcons name={icon} size={20} color={theme.textSecondary} />
      <Text style={{ flex: 1, fontSize: 14, color: theme.textPrimary }}>{label}</Text>
      {right}
    </Pressable>
  );

  const muted = (t: string) => <Text style={{ fontSize: 13, color: theme.textMuted }}>{t}</Text>;

  return (
    <Screen ambient="red" bottomNav={<BottomNav active="profile" />}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center', marginTop: 4 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: theme.ink,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: '700', color: theme.onInk }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textPrimary }} numberOfLines={1}>
              {user?.email ?? 'Not signed in'}
            </Text>
            <Text style={{ fontSize: 13, color: theme.textMuted }}>
              {row
                ? `${GOAL_LABEL[row.goal]} · ${EXP_LABEL[row.experienceLevel]} · ${row.trainingDays.length} days/wk`
                : 'Profile not set up yet'}
            </Text>
          </View>
        </View>

        <Glass style={{ flexDirection: 'row', paddingVertical: 16, marginTop: 18 }}>
          {(
            [
              [weightKg != null ? String(weightKg) : '—', 'kg'],
              [row ? String(row.heightCm) : '—', 'cm'],
              [String(workouts), 'workouts'],
            ] as const
          ).map(([v, l], i) => (
            <View
              key={l}
              style={{
                flex: 1,
                alignItems: 'center',
                borderLeftWidth: i === 0 ? 0 : 1,
                borderColor: theme.hairline,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textPrimary }}>{v}</Text>
              <Cap style={{ marginTop: 2 }}>{l}</Cap>
            </View>
          ))}
        </Glass>

        <Cap style={{ marginTop: 20, marginBottom: 10 }}>Settings</Cap>
        <Glass style={{ paddingHorizontal: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 }}>
            <MaterialCommunityIcons name="ruler" size={20} color={theme.textSecondary} />
            <Text style={{ flex: 1, fontSize: 14, color: theme.textPrimary }}>Units</Text>
            {muted('Metric')}
          </View>
          <Row
            icon="theme-light-dark"
            label="Appearance"
            onPress={toggle}
            right={muted(name === 'dark' ? 'Dark' : 'Light')}
          />
          <Row
            icon="logout"
            label="Sign out"
            onPress={doSignOut}
            right={<MaterialCommunityIcons name="chevron-right" size={20} color={theme.textDisabled} />}
          />
        </Glass>
      </ScrollView>
    </Screen>
  );
}
