import { useEffect, useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Glass, Cap, Title, Sub, PrimaryButton } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useOnboarding } from '@/store/onboarding';
import { listExercises } from '@/db/workoutRepo';
import { generateProgram, type ExerciseLike, type GeneratedProgram } from '@/lib/splitGenerator';

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

  // Live preview of the real split generator (docs/02) — the same rules that
  // run at completeOnboarding(), so what is shown here is what gets saved.
  const [plan, setPlan] = useState<GeneratedProgram | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listExercises()
      .then((library) => {
        if (cancelled) return;
        setPlan(
          generateProgram(
            {
              goal: draft.goal ?? 'general_fitness',
              experienceLevel: draft.experienceLevel ?? 'new',
              trainingDays: days.length > 0 ? days : [1, 3, 5],
              sessionLengthMin: draft.sessionLengthMin ?? 60,
              equipmentAccess: draft.equipmentAccess ?? 'gym',
              injuries: draft.injuries ?? [],
            },
            library as ExerciseLike[]
          )
        );
      })
      .catch((e: unknown) => !cancelled && setPlanError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          {`${plan?.templateName ?? 'Building your split'}\n· ${days.length} days · ${goalLabel}`}
        </Title>
        <Sub>
          {plan
            ? plan.rationale[0]
            : `${days.length} days a week, tuned for your ${goalLabel} phase.`}
        </Sub>

        <Glass style={{ padding: 14, marginTop: 22 }}>
          <Cap style={{ marginBottom: 12 }}>Your week</Cap>
          {plan === null ? (
            planError ? (
              <Text style={{ fontSize: 12, color: theme.redText }}>{planError}</Text>
            ) : (
              <ActivityIndicator color={theme.textMuted} />
            )
          ) : (
            <View style={{ gap: 10 }}>
              {plan.days.map((d) => (
                <View key={d.orderIndex} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: theme.textPrimary }}>
                      {d.weekday != null ? `${DAY_NAMES[d.weekday]} · ` : ''}
                      {d.label}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }} numberOfLines={1}>
                      {d.exercises.map((e) => e.name).join(' · ')}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: theme.textMuted, marginLeft: 10 }}>
                    {d.exercises.reduce((s, e) => s + e.targetSets, 0)} sets
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Glass>

        {plan && (
          <Glass style={{ padding: 14, marginTop: 12 }}>
            <Cap style={{ marginBottom: 10 }}>Why this plan</Cap>
            <View style={{ gap: 8 }}>
              {plan.rationale.map((line, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                  <Text style={{ fontSize: 12, color: theme.greenText }}>•</Text>
                  <Text style={{ flex: 1, fontSize: 12, color: theme.textSecondary, lineHeight: 17 }}>
                    {line}
                  </Text>
                </View>
              ))}
            </View>
          </Glass>
        )}

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
