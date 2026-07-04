import { ScrollView, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Glass, Cap, Title, Sub, PrimaryButton } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useOnboarding } from '@/store/onboarding';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const GOAL_LABEL: Record<string, string> = {
  fat_loss: 'fat loss',
  muscle_gain: 'muscle gain',
  recomp: 'recomp',
  general_fitness: 'general fitness',
};

export default function Ready() {
  const router = useRouter();
  const { theme } = useTheme();
  const draft = useOnboarding((s) => s.draft);
  const targets = useOnboarding((s) => s.targets)();

  const days = draft.trainingDays ?? [];
  const goalLabel = GOAL_LABEL[draft.goal ?? 'general_fitness'];
  // Simple alternating labels until the split generator (docs/02) is built.
  const week = days.map((d, i) => [
    `${DAY_NAMES[d]} · ${i % 2 === 0 ? 'Upper' : 'Lower'} ${i < 2 ? 'A' : 'B'}`,
    'planned',
  ]);

  return (
    <Screen ambient="default">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <View
          style={{
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 20,
            backgroundColor: 'rgba(16,185,129,0.15)',
            marginTop: 6,
          }}
        >
          <MaterialCommunityIcons name="creation" size={14} color={theme.greenText} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.greenText }}>Your plan is ready</Text>
        </View>

        <Title style={{ fontSize: 26, marginTop: 16, lineHeight: 32 }}>
          {`Upper / Lower\n· ${days.length} days · ${goalLabel}`}
        </Title>
        <Sub>
          {days.length} days a week → an upper/lower split blending strength and hypertrophy, tuned for your{' '}
          {goalLabel} phase.
        </Sub>

        <Glass style={{ padding: 14, marginTop: 22 }}>
          <Cap style={{ marginBottom: 12 }}>Your week</Cap>
          <View style={{ gap: 8 }}>
            {week.map(([d, n]) => (
              <View key={d} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: theme.textPrimary }}>{d}</Text>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>{n}</Text>
              </View>
            ))}
          </View>
        </Glass>

        {targets && (
          <Glass style={{ padding: 14, marginTop: 12 }}>
            <Cap style={{ marginBottom: 12 }}>Your daily targets</Cap>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Metric
                value={targets.calorieTarget.toLocaleString()}
                label={`calories · ${goalLabel}`}
                theme={theme}
              />
              <Metric value={targets.tdee.toLocaleString()} label="TDEE burn" theme={theme} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              {(
                [
                  [`${targets.macros.proteinG}g`, 'protein'],
                  [`${targets.macros.fatG}g`, 'fat'],
                  [`${targets.macros.carbG}g`, 'carbs'],
                ] as const
              ).map(([v, l]) => (
                <View
                  key={l}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    backgroundColor: theme.fillSoft,
                    borderRadius: 12,
                    paddingVertical: 10,
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textPrimary }}>{v}</Text>
                  <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{l}</Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <Text style={{ fontSize: 12, color: theme.textSecondary }}>Complete your profile for finer targets</Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: theme.greenText }}>Later ›</Text>
            </View>
          </Glass>
        )}
      </ScrollView>
      <View style={{ paddingTop: 12 }}>
        <PrimaryButton label="Start training" onPress={() => router.push('/onboarding/account')} />
      </View>
    </Screen>
  );
}

function Metric({ value, label, theme }: { value: string; label: string; theme: any }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', letterSpacing: -0.4, color: theme.textPrimary }}>{value}</Text>
      <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{label}</Text>
    </View>
  );
}
