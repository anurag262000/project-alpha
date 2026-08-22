/**
 * Shared plan furniture — the week strip, the sets-by-muscle bar and the day
 * card, specced in design/prototype/plan-handoff.html (stages 01 and 05).
 *
 * One component, three screens: the onboarding plan handoff, Today and the
 * Plan tab all render the same day card, so the counts can't drift apart
 * (docs/05-app-structure.md §6 step 3).
 *
 * Volume is neither drive nor progress, so the bar stays monochrome: the lead
 * muscle in ink, the rest in the soft fill. Red and green are reserved.
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Glass } from './ui';
import { useTheme } from '@/theme/ThemeProvider';
import { MUSCLE_LABEL, countMuscles, shortDayLabel, topMuscles, type MuscleCounts } from '@/lib/planLabels';
import type { Muscle } from '@/lib/splitGenerator';

// Re-exported so screens import their plan furniture from one place.
export { MUSCLE_LABEL, countMuscles, shortDayLabel, topMuscles, type MuscleCounts };

export const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

/** Monday-first weekday order, matching the prototype's strip. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Sets-by-muscle bar: lead segment in ink, the rest neutral. */
export function MuscleBar({ counts, height = 5 }: { counts: MuscleCounts; height?: number }) {
  const { theme } = useTheme();
  const top = topMuscles(counts);
  if (top.length === 0) return null;
  return (
    <View
      style={{
        flexDirection: 'row',
        height,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: theme.track,
        gap: 2,
      }}
    >
      {top.map(([m, v], i) => (
        <View
          key={m}
          style={{
            flex: v,
            borderRadius: 20,
            backgroundColor: i === 0 ? theme.ink : theme.fillSoft,
          }}
        />
      ))}
    </View>
  );
}

export function MuscleLegend({ counts }: { counts: MuscleCounts }) {
  const { theme } = useTheme();
  const top = topMuscles(counts);
  if (top.length === 0) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 7 }}>
      {top.map(([m, v]) => (
        <Text key={m} style={{ fontSize: 11, color: theme.textMuted }}>
          <Text style={{ color: theme.textSecondary }}>{MUSCLE_LABEL[m]}</Text> {v}
        </Text>
      ))}
    </View>
  );
}

/** Week strip: seven cells Monday-first, training days in ink. */
export function WeekStrip({
  /** Sub-label per weekday index (0=Sun..6=Sat); null / undefined means rest. */
  labels,
  today,
}: {
  labels: (string | null | undefined)[];
  today?: number;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {WEEK_ORDER.map((wd) => {
        const label = labels[wd];
        const train = !!label;
        return (
          <View
            key={wd}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingTop: 9,
              paddingBottom: 8,
              borderRadius: 13,
              backgroundColor: train ? theme.ink : theme.fieldBg,
              borderWidth: 1,
              borderColor: train ? theme.ink : theme.glassBorder,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: train ? theme.onInk : theme.textPrimary,
              }}
            >
              {DAY_LETTERS[wd]}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 9.5,
                marginTop: 2,
                color: train ? theme.onInk : theme.textMuted,
                opacity: train ? 0.62 : 1,
              }}
            >
              {wd === today ? 'today' : (label ?? 'rest')}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/**
 * One training day, tappable. Weekday, label, counts, and the neutral
 * sets-by-muscle bar — the shape of the session without opening it.
 */
export function DayCard({
  weekday,
  label,
  emphasis,
  exerciseCount,
  sets,
  minutes,
  counts,
  onPress,
}: {
  weekday: number | null;
  label: string;
  emphasis?: string;
  exerciseCount: number;
  sets: number;
  minutes: number;
  counts: MuscleCounts;
  onPress?: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.99 : 1 }] })}>
      <Glass style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            {weekday != null && (
              <Text
                style={{
                  fontSize: 11,
                  letterSpacing: 0.9,
                  textTransform: 'uppercase',
                  color: theme.textMuted,
                }}
              >
                {DAY_NAMES_SHORT[weekday]}
              </Text>
            )}
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                letterSpacing: -0.2,
                color: theme.textPrimary,
                marginTop: 2,
              }}
            >
              {label}
              {emphasis ? ` · ${emphasis}` : ''}
            </Text>
            <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 1 }}>
              {`${exerciseCount} exercises · ${sets} sets · ~${minutes} min`}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textDisabled} />
        </View>
        <View style={{ marginTop: 11 }}>
          <MuscleBar counts={counts} />
        </View>
        <MuscleLegend counts={counts} />
      </Glass>
    </Pressable>
  );
}
