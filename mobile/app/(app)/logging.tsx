import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, FlatList, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Glass, Cap, Title, Sub, PrimaryButton } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { getProfile } from '@/db/profileRepo';
import { getTodaysWorkout, type PlannedExercise, type TodaysWorkout } from '@/db/programRepo';
import {
  completeSession,
  getActiveSession,
  getSessionSets,
  lastPerformance,
  listExercises,
  logSet,
  startSession,
  type SetWithExercise,
} from '@/db/workoutRepo';
import { incrementFor } from '@/lib/progression';
import type { Exercise, LoggedSet, WorkoutSession } from '@/db/schema';

/** Rest defaults by exercise type (docs/04 — longer for compounds). */
const COMPOUND_PATTERNS = ['push', 'pull', 'hinge', 'squat'];
const restSecondsFor = (ex: Exercise) =>
  COMPOUND_PATTERNS.includes(ex.movementPattern) ? 120 : 75;

/** One row of the session: a plan slot, or an ad-hoc addition. */
interface Slot {
  key: string;
  programExerciseId: string | null;
  exercise: Exercise;
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
  hint: string | null;
  suggestedWeight: number | null;
}

const slotFromPlan = (p: PlannedExercise): Slot => ({
  key: p.plan.id,
  programExerciseId: p.plan.id,
  exercise: p.exercise,
  targetSets: p.plan.targetSets,
  targetRepMin: p.plan.targetRepMin,
  targetRepMax: p.plan.targetRepMax,
  hint: p.prescription.reason,
  suggestedWeight: p.prescription.weightKg,
});

export default function Logging() {
  const router = useRouter();
  const { theme } = useTheme();

  const [profileId, setProfileId] = useState<string | null>(null);
  const [today, setToday] = useState<TodaysWorkout | null>(null);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [sets, setSets] = useState<SetWithExercise[]>([]);
  const [openSlot, setOpenSlot] = useState<string | null>(null);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [picker, setPicker] = useState<{ mode: 'add' | 'substitute'; slotKey?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const p = await getProfile();
    if (!p) return setLoading(false);
    setProfileId(p.id);

    const workout = await getTodaysWorkout(p.id);
    setToday(workout);

    const active = await getActiveSession(p.id);
    setSession(active);
    if (active) {
      setSets(await getSessionSets(active.id));
      // Rebuild slots from the program day this session was started against,
      // but only on a cold load: refocusing must not discard substitutions or
      // exercises the user added mid-session.
      const plan = workout && !workout.isRestDay && workout.day?.id === active.programDayId
        ? workout.exercises.map(slotFromPlan)
        : [];
      setSlots((prev) => (prev.length > 0 ? prev : plan));
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const begin = async (programDayId: string | null, plan: PlannedExercise[]) => {
    if (!profileId) return;
    const s = await startSession(profileId, programDayId);
    setSession(s);
    setSets([]);
    setSlots(plan.map(slotFromPlan));
    setOpenSlot(plan[0]?.plan.id ?? null);
  };

  const finish = async () => {
    if (!session) return;
    await completeSession(session.id);
    router.replace({ pathname: '/summary', params: { sessionId: session.id } });
  };

  const onLogged = async () => {
    if (!session) return;
    setSets(await getSessionSets(session.id));
  };

  const openLibrary = async (mode: 'add' | 'substitute', slotKey?: string) => {
    if (library.length === 0) setLibrary(await listExercises());
    setPicker({ mode, slotKey });
  };

  const choose = (ex: Exercise) => {
    if (!picker) return;
    if (picker.mode === 'add') {
      setSlots((prev) => [
        ...prev,
        {
          key: `adhoc-${ex.id}-${prev.length}`,
          programExerciseId: null,
          exercise: ex,
          targetSets: 3,
          targetRepMin: 8,
          targetRepMax: 12,
          hint: 'Added off-plan.',
          suggestedWeight: null,
        },
      ]);
    } else {
      // Substitution keeps program_exercise_id pointing at the original plan
      // slot, so plan-vs-actual and substitution frequency stay visible.
      setSlots((prev) =>
        prev.map((s) =>
          s.key === picker.slotKey
            ? { ...s, exercise: ex, hint: `Substituted for the planned lift.`, suggestedWeight: null }
            : s
        )
      );
    }
    setPicker(null);
  };

  if (loading) {
    return (
      <Screen ambient="red">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.textMuted} />
        </View>
      </Screen>
    );
  }

  // ---- no active session: today's plan + start ----------------------------
  if (!session) {
    const plan = today && !today.isRestDay ? today.exercises : [];
    return (
      <Screen ambient="red">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <Title style={{ marginTop: 8 }}>{today?.day?.label ?? 'Workout'}</Title>
          <Sub>
            {plan.length > 0
              ? "Today's plan. Every set you log feeds the next session's targets."
              : 'No session scheduled today — you can still train off-plan.'}
          </Sub>

          {plan.length > 0 && (
            <Glass style={{ padding: 14, marginTop: 18, gap: 10 }}>
              {plan.map(({ plan: pe, exercise, prescription }) => (
                <View key={pe.id}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ flex: 1, fontSize: 14, color: theme.textPrimary }}>{exercise.name}</Text>
                    <Text style={{ fontSize: 12, color: theme.textSecondary, marginLeft: 10 }}>
                      {pe.targetSets} × {pe.targetRepMin}–{pe.targetRepMax}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                    {prescription.reason}
                  </Text>
                </View>
              ))}
            </Glass>
          )}

          <View style={{ marginTop: 20 }}>
            <PrimaryButton
              label={plan.length > 0 ? `Start ${today?.day?.label}` : 'Start ad-hoc workout'}
              onPress={() => begin(plan.length > 0 ? today!.day!.id : null, plan)}
            />
          </View>
        </ScrollView>
      </Screen>
    );
  }

  // ---- active session -----------------------------------------------------
  const workingSets = sets.filter((s) => !s.isWarmup);
  return (
    <Screen ambient="red">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable onPress={() => router.push('/home')} style={{ padding: 4 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={theme.textMuted} />
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textPrimary }}>
            {today?.day?.label ?? 'Ad-hoc workout'}
          </Text>
          <Cap>{workingSets.length} sets logged</Cap>
        </View>
        <Pressable onPress={finish} style={{ padding: 4 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.greenText }}>Finish</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ gap: 10, marginTop: 16 }}>
          {slots.map((slot) => (
            <ExerciseCard
              key={slot.key}
              slot={slot}
              sessionId={session.id}
              sets={sets.filter((s) => s.exerciseId === slot.exercise.id)}
              open={openSlot === slot.key}
              onToggle={() => setOpenSlot(openSlot === slot.key ? null : slot.key)}
              onLogged={onLogged}
              onSubstitute={() => openLibrary('substitute', slot.key)}
            />
          ))}
        </View>

        <Pressable onPress={() => openLibrary('add')} style={{ marginTop: 14 }}>
          <Glass style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name="plus" size={18} color={theme.textMuted} />
            <Text style={{ fontSize: 14, color: theme.textSecondary }}>Add an exercise</Text>
          </Glass>
        </Pressable>
      </ScrollView>

      <ExercisePicker
        open={picker !== null}
        exercises={library}
        onClose={() => setPicker(null)}
        onPick={choose}
      />
    </Screen>
  );
}

// --- One exercise: set list, stepper input, rest timer -----------------------

function ExerciseCard({
  slot,
  sessionId,
  sets,
  open,
  onToggle,
  onLogged,
  onSubstitute,
}: {
  slot: Slot;
  sessionId: string;
  sets: SetWithExercise[];
  open: boolean;
  onToggle: () => void;
  onLogged: () => Promise<void>;
  onSubstitute: () => void;
}) {
  const { theme } = useTheme();
  const step = useMemo(() => incrementFor(slot.exercise.equipment) || 2.5, [slot.exercise.equipment]);

  const [weight, setWeight] = useState<number | null>(null);
  const [reps, setReps] = useState(slot.targetRepMin);
  const [warmup, setWarmup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rest, setRest] = useState<number | null>(null);
  const [last, setLast] = useState<LoggedSet | null>(null);

  const done = sets.filter((s) => !s.isWarmup).length;

  // Seed the wheels from the last set of this exercise, then the prescription,
  // so a straight-sets session is confirm-only (docs/04).
  useEffect(() => {
    let cancelled = false;
    lastPerformance(slot.exercise.id).then((row) => {
      if (cancelled) return;
      setLast(row);
      setWeight((w) => (w != null ? w : (row?.weightKg ?? slot.suggestedWeight ?? 0)));
      if (row) setReps(Math.max(slot.targetRepMin, Math.min(row.reps, slot.targetRepMax)));
    });
    return () => {
      cancelled = true;
    };
  }, [slot.exercise.id, slot.suggestedWeight, slot.targetRepMin, slot.targetRepMax]);

  // Rest countdown.
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (rest === null) return;
    timerRef.current = setInterval(() => {
      setRest((r) => (r === null ? null : r <= 1 ? null : r - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [rest === null]);

  const submit = async () => {
    setBusy(true);
    try {
      await logSet({
        sessionId,
        exerciseId: slot.exercise.id,
        programExerciseId: slot.programExerciseId,
        reps,
        weightKg: weight ?? 0,
        isWarmup: warmup,
      });
      await onLogged();
      setWarmup(false);
      if (!warmup) setRest(restSecondsFor(slot.exercise));
    } finally {
      setBusy(false);
    }
  };

  const complete = done >= slot.targetSets;

  return (
    <Glass style={{ padding: 14 }}>
      <Pressable onPress={onToggle}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textPrimary }}>
              {slot.exercise.name}
            </Text>
            <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
              {done} / {slot.targetSets} sets · {slot.targetRepMin}–{slot.targetRepMax} reps
              {slot.programExerciseId === null ? ' · off-plan' : ''}
            </Text>
          </View>
          <MaterialCommunityIcons
            name={complete ? 'check-circle' : open ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={complete ? theme.green : theme.textMuted}
          />
        </View>
      </Pressable>

      {open && (
        <View style={{ marginTop: 14 }}>
          {slot.hint && (
            <Text style={{ fontSize: 11, color: theme.textMuted, marginBottom: 10, lineHeight: 16 }}>
              {slot.hint}
            </Text>
          )}
          {last && (
            <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 10 }}>
              last time ·{' '}
              <Text style={{ color: theme.redText }}>
                {last.weightKg} kg × {last.reps}
              </Text>
            </Text>
          )}

          {rest !== null ? (
            <RestTimer
              seconds={rest}
              onAdjust={(delta) => setRest((r) => Math.max(1, (r ?? 0) + delta))}
              onSkip={() => setRest(null)}
            />
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Stepper
                  label="KG"
                  value={weight ?? 0}
                  step={step}
                  min={0}
                  onChange={(v) => setWeight(v)}
                  format={(v) => (Number.isInteger(v) ? `${v}` : v.toFixed(1))}
                />
                <Stepper label="Reps" value={reps} step={1} min={1} max={50} onChange={setReps} />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
                <Pressable
                  onPress={() => setWarmup((w) => !w)}
                  style={{
                    paddingVertical: 7,
                    paddingHorizontal: 12,
                    borderRadius: 20,
                    backgroundColor: warmup ? theme.fillSoft : 'transparent',
                    borderWidth: 1,
                    borderColor: warmup ? theme.ink : theme.glassBorder,
                  }}
                >
                  <Text style={{ fontSize: 12, color: warmup ? theme.textPrimary : theme.textMuted }}>
                    Warm-up
                  </Text>
                </Pressable>
                <Pressable onPress={onSubstitute} style={{ paddingVertical: 7 }}>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>Substitute ›</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={busy ? undefined : submit}
                style={{
                  marginTop: 14,
                  backgroundColor: theme.green,
                  borderRadius: 15,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: busy ? 0.6 : 1,
                }}
              >
                <MaterialCommunityIcons name="check" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
                  {busy ? 'Logging…' : `Log set ${done + 1}`}
                </Text>
              </Pressable>
            </>
          )}

          {sets.length > 0 && (
            <View style={{ marginTop: 14, gap: 7 }}>
              {sets.map((s) => (
                <View key={s.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>
                    Set {s.setIndex}
                    {s.isWarmup ? ' · warm-up' : ''}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                    {s.weightKg} kg × {s.reps}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </Glass>
  );
}

function RestTimer({
  seconds,
  onAdjust,
  onSkip,
}: {
  seconds: number;
  onAdjust: (delta: number) => void;
  onSkip: () => void;
}) {
  const { theme } = useTheme();
  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, '0');
  return (
    <View style={{ alignItems: 'center', paddingVertical: 8 }}>
      <Cap>Rest</Cap>
      <Text style={{ fontSize: 34, fontWeight: '700', color: theme.textPrimary, letterSpacing: -1 }}>
        {mm}:{ss}
      </Text>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        {[
          ['-15s', -15],
          ['+15s', 15],
        ].map(([label, delta]) => (
          <Pressable
            key={label as string}
            onPress={() => onAdjust(delta as number)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: theme.glassBorder,
            }}
          >
            <Text style={{ fontSize: 13, color: theme.textSecondary }}>{label as string}</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={onSkip}
          style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: theme.fillSoft }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textPrimary }}>Skip</Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Keyboard-less numeric input. docs/04 specifies three scroll wheels; a
 * stepper hits the same requirement (no keyboard, defaults to the last
 * value, repeat sets are confirm-only) in a fraction of the code.
 * ponytail: swap in real wheels if the tap count becomes annoying.
 */
function Stepper({
  label,
  value,
  step,
  min = 0,
  max = 9999,
  onChange,
  format,
}: {
  label: string;
  value: number;
  step: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const { theme } = useTheme();
  const clamp = (v: number) => Math.max(min, Math.min(max, Math.round(v * 100) / 100));
  const Btn = ({ icon, delta }: { icon: any; delta: number }) => (
    <Pressable
      onPress={() => onChange(clamp(value + delta))}
      hitSlop={6}
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.fillSoft,
      }}
    >
      <MaterialCommunityIcons name={icon} size={18} color={theme.textPrimary} />
    </Pressable>
  );

  return (
    <View style={{ flex: 1 }}>
      <Cap style={{ marginBottom: 6, marginLeft: 4 }}>{label}</Cap>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.fieldBg,
          borderWidth: 1,
          borderColor: theme.glassBorder,
          borderRadius: 14,
          padding: 6,
        }}
      >
        <Btn icon="minus" delta={-step} />
        <Text style={{ fontSize: 18, fontWeight: '600', color: theme.textPrimary }}>
          {format ? format(value) : value}
        </Text>
        <Btn icon="plus" delta={step} />
      </View>
    </View>
  );
}

function ExercisePicker({
  open,
  exercises,
  onClose,
  onPick,
}: {
  open: boolean;
  exercises: Exercise[];
  onClose: () => void;
  onPick: (ex: Exercise) => void;
}) {
  const { theme } = useTheme();
  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.canvas, paddingTop: 60, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title style={{ fontSize: 20 }}>Pick exercise</Title>
          <Pressable onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color={theme.textMuted} />
          </Pressable>
        </View>
        <FlatList
          data={exercises}
          keyExtractor={(e) => e.id}
          style={{ marginTop: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onPick(item)}
              style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.hairline }}
            >
              <Text style={{ fontSize: 15, color: theme.textPrimary }}>{item.name}</Text>
              <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                {item.primaryMuscle} · {item.equipment.join(', ')}
              </Text>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}
