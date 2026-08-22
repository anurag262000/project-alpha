/**
 * Stage 01 + 04 of design/prototype/plan-handoff.html — the plan handoff.
 * Replaces the old `ready.tsx`.
 *
 * One question gets answered here: *what am I on?* The plan name is the
 * headline, the chips carry the constraints it was built from, and every
 * training day is a card that opens a sheet. Acceptance is a button that is
 * present from the first second — browsing days and exercises is optional
 * depth, never a gate — and its label says what happens next.
 *
 * The confirmation is a toast, not a screen: a congratulations page here is a
 * wall between intent and action (docs/05-app-structure.md §4).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Glass, Cap, Title, Sub, PrimaryButton, GhostButton } from '@/components/ui';
import { DayCard, WeekStrip, countMuscles, shortDayLabel, DAY_NAMES } from '@/components/plan';
import { DaySheet } from '@/components/planSheets';
import { useTheme } from '@/theme/ThemeProvider';
import { useOnboarding } from '@/store/onboarding';
import { listExercises } from '@/db/workoutRepo';
import { completeOnboarding } from '@/db/profileRepo';
import {
  estimatedMinutes,
  generateProgram,
  type ExerciseLike,
  type GeneratedDay,
  type GeneratedProgram,
  type Muscle,
} from '@/lib/splitGenerator';
import type { Exercise } from '@/db/schema';

const GOAL_LABEL: Record<string, string> = {
  fat_loss: 'Fat loss',
  muscle_gain: 'Muscle gain',
  recomp: 'Recomp',
  general_fitness: 'General fitness',
};

const EMPHASIS_LABEL: Record<string, string> = {
  strength: 'strength',
  hypertrophy: 'hypertrophy',
  balanced: 'balanced',
};

export default function Plan() {
  const router = useRouter();
  const { theme } = useTheme();
  const draft = useOnboarding((s) => s.draft);
  const resetDraft = useOnboarding((s) => s.reset);
  const targets = useOnboarding((s) => s.targets)();

  const days = draft.trainingDays ?? [];
  const goal = draft.goal ?? 'general_fitness';

  const [library, setLibrary] = useState<Exercise[] | null>(null);
  const [plan, setPlan] = useState<GeneratedProgram | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openDay, setOpenDay] = useState<GeneratedDay | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useRef(new Animated.Value(0)).current;

  // Live preview of the real split generator (docs/02) — the same rules that
  // run at completeOnboarding(), so what is shown here is what gets saved.
  useEffect(() => {
    let cancelled = false;
    listExercises()
      .then((rows) => {
        if (cancelled) return;
        setLibrary(rows);
        setPlan(
          generateProgram(
            {
              goal,
              experienceLevel: draft.experienceLevel ?? 'new',
              trainingDays: days.length > 0 ? days : [1, 3, 5],
              sessionLengthMin: draft.sessionLengthMin ?? 60,
              equipmentAccess: draft.equipmentAccess ?? 'gym',
              injuries: draft.injuries ?? [],
            },
            rows as ExerciseLike[]
          )
        );
      })
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byId = useMemo(() => new Map((library ?? []).map((e) => [e.id, e])), [library]);
  const primaryMuscleOf = (id: string) => byId.get(id)?.primaryMuscle as Muscle | undefined;

  // rationale[0] is the subtitle; "Why this plan" carries the rest, so the
  // same sentence is never printed twice on one screen.
  const why = plan?.rationale.slice(1) ?? [];

  const firstDay = plan?.days[0];
  const weekLabels: (string | null)[] = Array(7).fill(null);
  for (const d of plan?.days ?? []) {
    if (d.weekday != null) weekLabels[d.weekday] = shortDayLabel(d.label);
  }

  const accept = async () => {
    if (saving) return;
    setSaving(true);
    Animated.timing(toast, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    try {
      await completeOnboarding(draft);
      resetDraft();
      // Let the toast land before Today takes over.
      setTimeout(() => router.replace('/home'), 900);
    } catch (e) {
      Animated.timing(toast, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      setError(e instanceof Error ? e.message : 'Could not save your plan.');
      setSaving(false);
    }
  };

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
          <MaterialCommunityIcons name="check" size={14} color={theme.greenText} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.greenText }}>
            Built from your answers
          </Text>
        </View>

        <Title style={{ fontSize: 26, marginTop: 14, lineHeight: 31 }}>
          {plan?.templateName ?? 'Building your split'}
        </Title>
        {plan && <Sub>{plan.rationale[0]}</Sub>}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 14 }}>
          <Chip text={`${days.length} days · week`} />
          <Chip text={`${draft.sessionLengthMin ?? 60} min`} />
          <Chip text={GOAL_LABEL[goal]} tone={theme.redText} />
        </View>

        {error && (
          <Text style={{ fontSize: 12, color: theme.redText, marginTop: 14 }}>{error}</Text>
        )}

        {plan === null ? (
          <View style={{ paddingVertical: 40 }}>
            {!error && <ActivityIndicator color={theme.textMuted} />}
          </View>
        ) : (
          <>
            <Cap style={{ marginTop: 22, marginBottom: 9 }}>Your week</Cap>
            <WeekStrip labels={weekLabels} />

            <Cap style={{ marginTop: 22, marginBottom: 9 }}>Tap a day to see what's in it</Cap>
            <View style={{ gap: 10 }}>
              {plan.days.map((d) => {
                const sets = d.exercises.reduce((s, e) => s + e.targetSets, 0);
                return (
                  <DayCard
                    key={d.orderIndex}
                    weekday={d.weekday}
                    label={d.label}
                    emphasis={EMPHASIS_LABEL[d.emphasis]}
                    exerciseCount={d.exercises.length}
                    sets={sets}
                    minutes={estimatedMinutes(sets, goal)}
                    counts={countMuscles(d.exercises, primaryMuscleOf)}
                    onPress={() => setOpenDay(d)}
                  />
                );
              })}
            </View>

            {why.length > 0 && (
              <Glass style={{ padding: 14, marginTop: 14 }}>
                <Pressable
                  onPress={() => setWhyOpen((v) => !v)}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}
                >
                  <View style={{ flex: 1 }}>
                    <Cap>Why this plan</Cap>
                    <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>
                      {`${why.length} rules picked it. Tap to read them.`}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={whyOpen ? 'chevron-down' : 'chevron-right'}
                    size={19}
                    color={theme.textDisabled}
                  />
                </Pressable>
                {whyOpen && (
                  <View style={{ gap: 6, marginTop: 11 }}>
                    {why.map((line, i) => (
                      <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                        <Text style={{ fontSize: 12.5, color: theme.textMuted }}>•</Text>
                        <Text style={{ flex: 1, fontSize: 12.5, lineHeight: 20, color: theme.textSecondary }}>
                          {line}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </Glass>
            )}

            {targets && (
              <Glass
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 13,
                  paddingHorizontal: 15,
                  marginTop: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Cap>Daily targets</Cap>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textPrimary, marginTop: 3 }}>
                    {`${targets.calorieTarget.toLocaleString()} kcal · ${targets.macros.proteinG} g protein`}
                  </Text>
                </View>
              </Glass>
            )}
          </>
        )}
      </ScrollView>

      <View style={{ paddingTop: 12 }}>
        <PrimaryButton label="Use this plan" onPress={accept} />
        <GhostButton
          label="Change my days or equipment"
          onPress={() => router.push('/onboarding/schedule')}
        />
      </View>

      {/* Stage 04 — the confirmation, one line, over the plan. */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: 96,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 11,
          paddingVertical: 13,
          paddingHorizontal: 15,
          borderRadius: 16,
          backgroundColor: theme.ink,
          opacity: toast,
        }}
      >
        <MaterialCommunityIcons name="check" size={20} color={theme.green} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13.5, fontWeight: '600', color: theme.onInk }}>Plan saved</Text>
          {firstDay && (
            <Text style={{ fontSize: 12, color: theme.onInk, opacity: 0.72, marginTop: 1 }}>
              {`First session: ${firstDay.weekday != null ? DAY_NAMES[firstDay.weekday] : 'day 1'} · ${firstDay.label}`}
            </Text>
          )}
        </View>
      </Animated.View>

      <DaySheet
        day={openDay}
        goal={goal}
        weeklyVolume={plan?.weeklyVolume ?? {}}
        counts={openDay ? countMuscles(openDay.exercises, primaryMuscleOf) : {}}
        exerciseById={(id) => byId.get(id)}
        onClose={() => setOpenDay(null)}
      />
    </Screen>
  );
}

function Chip({ text, tone }: { text: string; tone?: string }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        paddingVertical: 6,
        paddingHorizontal: 11,
        borderRadius: 20,
        backgroundColor: theme.fieldBg,
        borderWidth: 1,
        borderColor: theme.glassBorder,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: '500', color: tone ?? theme.textSecondary }}>{text}</Text>
    </View>
  );
}
