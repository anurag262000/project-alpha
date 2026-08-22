/**
 * Stage 02 + 03 of design/prototype/plan-handoff.html: the day sheet and the
 * exercise sheet that opens on top of it.
 *
 * Sheets, not routes — the plan stays behind them, so browsing three days and
 * then accepting never involves a back stack, and "Use this plan" is never
 * more than one dismiss away. The day sheet stops at 87% and the exercise
 * sheet at 92%, so what you came from is always legible underneath.
 *
 * Both live in one <Modal> rather than nesting modals: nested native modals
 * are unreliable on Android, and the prototype stacks them in one layer anyway.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BodyMap, type Highlight } from './BodyMap';
import { Cap, Glass } from './ui';
import { MUSCLE_LABEL, MuscleBar, MuscleLegend, DAY_NAMES, type MuscleCounts } from './plan';
import { useTheme } from '@/theme/ThemeProvider';
import { restSecFor, type GeneratedDay, type GeneratedExercise, type Muscle, type MovementPattern } from '@/lib/splitGenerator';
import type { Goal } from '@/lib/health';
import type { Exercise } from '@/db/schema';

const EMPHASIS_LABEL: Record<string, string> = {
  strength: 'strength',
  hypertrophy: 'hypertrophy',
  balanced: 'balanced',
};

/**
 * Compound / secondary / isolation, so the ordering rule on the sheet is
 * visible rather than asserted. Barbell compounds lead; other compounds are
 * secondary work; the isolation pattern speaks for itself.
 */
export function patternTag(ex: Exercise): string {
  if (ex.movementPattern === 'isolation') return 'Isolation';
  return ex.equipment.includes('barbell') ? 'Compound' : 'Secondary';
}

const PATTERN_PHRASE: Record<MovementPattern, string> = {
  push: 'A pressing movement',
  pull: 'A pulling movement',
  hinge: 'A hip-hinge movement',
  squat: 'A squat-pattern movement',
  carry: 'A loaded carry',
  isolation: 'An isolation movement',
};

/**
 * The one-line definition. The 58-row seed has no prose, so this is built from
 * the row's own classification rather than left blank — never the dataset's
 * instruction blob (which does not exist yet either).
 */
function definition(ex: Exercise): string {
  const primary = MUSCLE_LABEL[ex.primaryMuscle as Muscle]?.toLowerCase() ?? ex.primaryMuscle;
  const also = (ex.secondaryMuscles ?? [])
    .map((m) => MUSCLE_LABEL[m as Muscle]?.toLowerCase() ?? m)
    .slice(0, 2);
  const kit = ex.equipment.join(' + ');
  return (
    `${PATTERN_PHRASE[ex.movementPattern]} for ${primary}` +
    (also.length ? `, also working ${also.join(' and ')}` : '') +
    ` — ${kit}.`
  );
}

/** `instructions` is one blob at seed time; split it into at most four cues. */
function cues(instructions: string | null): string[] {
  if (!instructions?.trim()) return [];
  return instructions
    .split(/\n+|(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);
}

/* -------------------------------------------------------------------------- */
/* sheet primitive                                                            */
/* -------------------------------------------------------------------------- */

function Sheet({
  open,
  heightPct,
  onClosed,
  children,
}: {
  open: boolean;
  heightPct: number;
  /** Fired once the close animation has finished, so the host can unmount. */
  onClosed?: () => void;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const { height } = useWindowDimensions();
  const h = Math.round(height * heightPct);
  const y = useRef(new Animated.Value(h)).current;

  useEffect(() => {
    Animated.timing(y, {
      toValue: open ? 0 : h,
      duration: open ? 340 : 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !open) onClosed?.();
    });
    // onClosed is re-created each render; the animation only depends on open/h.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, h]);

  return (
    <Animated.View
      pointerEvents={open ? 'auto' : 'none'}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: h,
        transform: [{ translateY: y }],
        backgroundColor: theme.canvas,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        overflow: 'hidden',
      }}
    >
      <View style={{ paddingTop: 9, paddingBottom: 3, alignItems: 'center' }}>
        <View style={{ width: 38, height: 5, borderRadius: 20, backgroundColor: theme.track }} />
      </View>
      {children}
    </Animated.View>
  );
}

function SheetHead({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        paddingTop: 6,
        paddingBottom: 12,
        paddingHorizontal: 18,
        borderBottomWidth: 1,
        borderBottomColor: theme.hairline,
      }}
    >
      {children}
    </View>
  );
}

function SheetFoot({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: theme.hairline,
      }}
    >
      {children}
    </View>
  );
}

function Chip({ text, icon }: { text: string; icon?: any }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 6,
        paddingHorizontal: 11,
        borderRadius: 20,
        backgroundColor: theme.fieldBg,
        borderWidth: 1,
        borderColor: theme.glassBorder,
      }}
    >
      {icon && <MaterialCommunityIcons name={icon} size={14} color={theme.textSecondary} />}
      <Text style={{ fontSize: 12, fontWeight: '500', color: theme.textSecondary }}>{text}</Text>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: theme.fillSoft }}>
      <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textPrimary }}>{value}</Text>
      <Text style={{ fontSize: 10.5, letterSpacing: 0.7, textTransform: 'uppercase', color: theme.textMuted }}>
        {label}
      </Text>
    </View>
  );
}

function FootLink({ icon, label, onPress, strong }: { icon?: any; label: string; onPress: () => void; strong?: boolean }) {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 11 }}>
      {icon && <MaterialCommunityIcons name={icon} size={16} color={strong ? theme.textPrimary : theme.textSecondary} />}
      <Text
        style={{
          fontSize: 13.5,
          fontWeight: strong ? '600' : '500',
          color: strong ? theme.textPrimary : theme.textSecondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* stage 02 — the day                                                          */
/* -------------------------------------------------------------------------- */

export interface DaySheetProps {
  /** The open day, or null. Non-null mounts the modal. */
  day: GeneratedDay | null;
  goal: Goal;
  /** Planned weekly sets per muscle — used to place this session in the week. */
  weeklyVolume: MuscleCounts;
  /** Session sets per muscle, already counted by the caller. */
  counts: MuscleCounts;
  exerciseById: (id: string) => Exercise | undefined;
  onClose: () => void;
}

export function DaySheet({ day, goal, weeklyVolume, counts, exerciseById, onClose }: DaySheetProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [openEx, setOpenEx] = useState<GeneratedExercise | null>(null);
  const scrim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (day) setMounted(true);
    else setOpenEx(null);
    Animated.timing(scrim, {
      toValue: day ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [day, scrim]);

  // Keep rendering the last day while the sheet animates out.
  const shown = useRef<GeneratedDay | null>(null);
  if (day) shown.current = day;
  const d = shown.current;

  if (!mounted || !d) return null;

  const sets = d.exercises.reduce((s, e) => s + e.targetSets, 0);
  const rest = restSecFor(goal);
  const [leadMuscle, leadSets] = (Object.entries(counts) as [Muscle, number][]).sort(
    (a, b) => b[1] - a[1]
  )[0] ?? ['chest' as Muscle, 0];
  const weekLead = weeklyVolume[leadMuscle] ?? 0;
  const share = weekLead > 0 ? Math.round((leadSets / weekLead) * 100) : 0;

  const back = () => (openEx ? setOpenEx(null) : onClose());

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={back} statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: scrim }]}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(20,20,25,0.42)' }} onPress={onClose} />
        </Animated.View>

        <Sheet open={day !== null} heightPct={0.87} onClosed={() => setMounted(false)}>
          <SheetHead>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <View style={{ flex: 1 }}>
                {d.weekday != null && <Cap>{DAY_NAMES[d.weekday]}</Cap>}
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '700',
                    letterSpacing: -0.4,
                    color: theme.textPrimary,
                    marginTop: 2,
                  }}
                >
                  {d.label} · {EMPHASIS_LABEL[d.emphasis]}
                </Text>
              </View>
              <Chip icon="clock-outline" text={`~${Math.round(8 + sets * ((rest + 40) / 60))} min`} />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 11 }}>
              <Chip text={`${d.exercises.length} exercises`} />
              <Chip text={`${sets} sets`} />
              <Chip text={`Rest ${rest} s`} />
            </View>
          </SheetHead>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 20 }}
          >
            <Cap>Sets by muscle · this session</Cap>
            <View style={{ marginTop: 9 }}>
              <MuscleBar counts={counts} height={7} />
            </View>
            <MuscleLegend counts={counts} />
            {share > 0 && (
              <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 9, lineHeight: 18 }}>
                {`${share}% of your weekly ${MUSCLE_LABEL[leadMuscle].toLowerCase()} volume sits in this session.`}
              </Text>
            )}

            <Cap style={{ marginTop: 20, marginBottom: 2 }}>In order</Cap>
            {d.exercises.map((e, i) => {
              const ex = exerciseById(e.exerciseId);
              return (
                <Pressable
                  key={e.exerciseId}
                  onPress={() => ex && setOpenEx(e)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 13,
                    borderBottomWidth: i === d.exercises.length - 1 ? 0 : 1,
                    borderBottomColor: theme.hairline,
                  }}
                >
                  <Text style={{ width: 15, fontSize: 12, color: theme.textMuted }}>{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14.5, fontWeight: '500', color: theme.textPrimary }}>{e.name}</Text>
                    <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 1 }}>
                      {`${e.targetSets} × ${e.targetRepMin}–${e.targetRepMax}`}
                      {e.targetRpe != null ? ` · RPE ${e.targetRpe}` : ''}
                    </Text>
                  </View>
                  {ex && (
                    <Text
                      style={{
                        fontSize: 9.5,
                        letterSpacing: 0.85,
                        textTransform: 'uppercase',
                        color: theme.textMuted,
                        borderWidth: 1,
                        borderColor: theme.hairline,
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                        borderRadius: 6,
                      }}
                    >
                      {patternTag(ex)}
                    </Text>
                  )}
                  <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textDisabled} />
                </Pressable>
              );
            })}

            <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 16, lineHeight: 19 }}>
              Order is deliberate: barbell compounds while you're fresh, isolation once fatigue is paid for.
            </Text>
          </ScrollView>

          <SheetFoot>
            <FootLink icon="arrow-left" label="Back to plan" onPress={onClose} />
          </SheetFoot>
        </Sheet>

        <ExerciseSheet
          planned={openEx}
          day={d}
          goal={goal}
          weeklyVolume={weeklyVolume}
          exerciseById={exerciseById}
          onClose={() => setOpenEx(null)}
        />
      </View>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* stage 03 — an exercise                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Three questions in a fixed order, every time, so the screen is learnable:
 * what is this, how do I do it, why is it here. Blocks with no data behind
 * them are dropped rather than shown empty — the seed has no `mediaUrl` or
 * `instructions` yet, so the demo tile and the cue list simply don't render.
 */
function ExerciseSheet({
  planned,
  day,
  goal,
  weeklyVolume,
  exerciseById,
  onClose,
}: {
  planned: GeneratedExercise | null;
  day: GeneratedDay;
  goal: Goal;
  weeklyVolume: MuscleCounts;
  exerciseById: (id: string) => Exercise | undefined;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const shown = useRef<GeneratedExercise | null>(null);
  if (planned) shown.current = planned;
  const p = shown.current;
  const ex = p ? exerciseById(p.exerciseId) : undefined;
  if (!p || !ex) return null;

  const rest = restSecFor(goal);
  const steps = cues(ex.instructions);
  const primary = ex.primaryMuscle as Muscle;
  const highlight: Highlight = { [primary]: 'primary' };
  for (const m of ex.secondaryMuscles ?? []) highlight[m as Muscle] = 'secondary';

  const weekly = weeklyVolume[primary] ?? 0;
  const position =
    p.orderIndex === 0
      ? "First movement of the day, while you're fresh"
      : ex.movementPattern === 'isolation'
        ? 'Isolation work, placed after the compounds so the fatigue is already paid for'
        : `Movement ${p.orderIndex + 1} of the day, before fatigue reaches the isolation work`;
  const volumeClause =
    weekly > 0 ? ` — and it covers ${p.targetSets} of your ${weekly} weekly ${MUSCLE_LABEL[primary].toLowerCase()} sets.` : '.';

  const dayName = day.weekday != null ? DAY_NAMES[day.weekday] : 'session';

  return (
    <Sheet open={planned !== null} heightPct={0.92}>
      <SheetHead>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', letterSpacing: -0.4, color: theme.textPrimary }}>
              {ex.name}
            </Text>
            <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 3 }}>
              {`${ex.equipment.join(' + ')} · ${ex.difficulty}`}
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10} style={{ padding: 4 }}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>
      </SheetHead>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 20 }}
      >
        {/* 1. what it is */}
        <Text style={{ fontSize: 13.5, lineHeight: 21, color: theme.textSecondary }}>{definition(ex)}</Text>

        {/* 2. your prescription — the app talking about you, so it sits above
            the generic content */}
        <Glass style={{ padding: 14, marginTop: 14 }}>
          <Cap>{`Your prescription · ${dayName}`}</Cap>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <Stat value={String(p.targetSets)} label="sets" />
            <Stat value={`${p.targetRepMin}–${p.targetRepMax}`} label="reps" />
            {p.targetRpe != null && <Stat value={String(p.targetRpe)} label="rpe" />}
            <Stat value={`${rest} s`} label="rest" />
          </View>
          <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 10, lineHeight: 18 }}>
            {`Start at a load you can hold for ${p.targetRepMin} clean reps and let the app move it: hit ${p.targetRepMax} on every set and the weight goes up next ${dayName}.`}
          </Text>
        </Glass>

        {/* 3. how to do it — only when the row actually carries cues */}
        {steps.length > 0 && (
          <>
            <Cap style={{ marginTop: 20 }}>How to do it</Cap>
            <View style={{ gap: 11, marginTop: 12 }}>
              {steps.map((s, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 11 }}>
                  <View
                    style={{
                      width: 21,
                      height: 21,
                      borderRadius: 11,
                      backgroundColor: theme.ink,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 1,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '600', color: theme.onInk }}>{i + 1}</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 13, lineHeight: 20, color: theme.textSecondary }}>{s}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* 4. what it works */}
        <Cap style={{ marginTop: 20, marginBottom: 9 }}>What it works</Cap>
        <Glass style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 }}>
          <BodyMap view="both" highlight={highlight} size={130} />
          <View style={{ flex: 1, gap: 7 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13.5, fontWeight: '600', color: theme.textPrimary }}>
                {MUSCLE_LABEL[primary]}
              </Text>
              <Text style={{ fontSize: 11, color: theme.redText }}>primary</Text>
            </View>
            {(ex.secondaryMuscles ?? []).map((m) => (
              <View key={m} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                  {MUSCLE_LABEL[m as Muscle] ?? m}
                </Text>
                <Text style={{ fontSize: 11, color: theme.textMuted }}>secondary</Text>
              </View>
            ))}
          </View>
        </Glass>

        {/* 5. why it's here */}
        <Glass style={{ padding: 14, marginTop: 12 }}>
          <Cap>Why it's in your plan</Cap>
          <Text style={{ fontSize: 13, lineHeight: 20, color: theme.textSecondary, marginTop: 6 }}>
            {position}
            {volumeClause}
          </Text>
        </Glass>
      </ScrollView>

      <SheetFoot>
        <View style={{ flex: 1 }} />
        <FootLink label="Done" onPress={onClose} strong />
      </SheetFoot>
    </Sheet>
  );
}
