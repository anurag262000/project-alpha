import { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Glass, Cap, Title, Sub, PrimaryButton } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useOnboarding } from '@/store/onboarding';
import { listExercises } from '@/db/workoutRepo';
import {
  generateProgram,
  type ExerciseLike,
  type GeneratedDay,
  type GeneratedProgram,
} from '@/lib/splitGenerator';

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
  // Which day's exercises are open. The first day starts open: the whole point
  // of this screen is showing what you'll actually be doing (docs/05 §5).
  const [openDay, setOpenDay] = useState(0);
  const [whyOpen, setWhyOpen] = useState(false);

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

  // rationale[0] is the subtitle; "Why this plan" carries the rest so the same
  // sentence isn't printed twice on one screen.
  const why = plan?.rationale.slice(1) ?? [];
  const whyShown = whyOpen ? why : why.slice(0, 2);

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

        <Title style={{ fontSize: 28, marginTop: 14, lineHeight: 34 }}>
          {plan?.templateName ?? 'Building your split'}
        </Title>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          <Chip text={`${days.length} days / week`} />
          <Chip text={goalLabel} />
          <Chip text={`${draft.sessionLengthMin ?? 60} min`} />
        </View>
        {plan && <Sub>{plan.rationale[0]}</Sub>}

        <Glass style={{ padding: 4, marginTop: 20 }}>
          <Cap style={{ margin: 12, marginBottom: 6 }}>Your week</Cap>
          {plan === null ? (
            <View style={{ padding: 14 }}>
              {planError ? (
                <Text style={{ fontSize: 12, color: theme.redText }}>{planError}</Text>
              ) : (
                <ActivityIndicator color={theme.textMuted} />
              )}
            </View>
          ) : (
            plan.days.map((d, i) => (
              <DayRow
                key={d.orderIndex}
                day={d}
                open={openDay === i}
                onToggle={() => setOpenDay(openDay === i ? -1 : i)}
              />
            ))
          )}
        </Glass>

        {why.length > 0 && (
          <Glass style={{ padding: 14, marginTop: 12 }}>
            <Pressable
              onPress={() => setWhyOpen((v) => !v)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Cap>Why this plan</Cap>
              <MaterialCommunityIcons
                name={whyOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={theme.textMuted}
              />
            </Pressable>
            <View style={{ gap: 8, marginTop: 10 }}>
              {whyShown.map((line, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                  <Text style={{ fontSize: 12, color: theme.greenText }}>•</Text>
                  <Text
                    style={{ flex: 1, fontSize: 12, color: theme.textSecondary, lineHeight: 17 }}
                    numberOfLines={whyOpen ? undefined : 2}
                  >
                    {line}
                  </Text>
                </View>
              ))}
            </View>
          </Glass>
        )}

        {targets && (
          <Glass style={{ padding: 14, marginTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <Text style={{ fontSize: 22, fontWeight: '700', letterSpacing: -0.4, color: theme.textPrimary }}>
                {targets.calorieTarget.toLocaleString()}
              </Text>
              <Text style={{ fontSize: 12, color: theme.textMuted, flex: 1 }}>
                {`kcal a day · ${targets.macros.proteinG}g protein · ${targets.macros.fatG}g fat · ${targets.macros.carbG}g carbs`}
              </Text>
            </View>
          </Glass>
        )}
      </ScrollView>
      <View style={{ paddingTop: 12 }}>
        <PrimaryButton label="Save my plan" onPress={() => router.push('/onboarding/account')} />
      </View>
    </Screen>
  );
}

function Chip({ text }: { text: string }) {
  const { theme } = useTheme();
  return (
    <View style={{ paddingVertical: 5, paddingHorizontal: 10, borderRadius: 10, backgroundColor: theme.fillSoft }}>
      <Text style={{ fontSize: 12, fontWeight: '500', color: theme.textSecondary }}>{text}</Text>
    </View>
  );
}

/** One training day: tap to see the exercises you'll actually be doing. */
function DayRow({ day, open, onToggle }: { day: GeneratedDay; open: boolean; onToggle: () => void }) {
  const { theme } = useTheme();
  const sets = day.exercises.reduce((s, e) => s + e.targetSets, 0);
  return (
    <View>
      <Pressable
        onPress={onToggle}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: 11,
          paddingHorizontal: 12,
          borderRadius: 12,
          backgroundColor: open ? theme.fillSoft : 'transparent',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textPrimary }}>
            {day.weekday != null ? `${DAY_NAMES[day.weekday]} · ` : ''}
            {day.label}
          </Text>
          <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
            {`${day.exercises.length} exercises · ${sets} sets`}
          </Text>
        </View>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.textMuted}
        />
      </Pressable>
      {open && (
        <View style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 7 }}>
          {day.exercises.map((e) => (
            <View key={e.exerciseId} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ flex: 1, fontSize: 13, color: theme.textSecondary }}>{e.name}</Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: theme.textMuted }}>
                {`${e.targetSets} × ${e.targetRepMin}–${e.targetRepMax}`}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
