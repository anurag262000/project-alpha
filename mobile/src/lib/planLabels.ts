/**
 * Pure formatting behind the plan furniture (components/plan.tsx) — kept out
 * of the component file so `node --test` can reach it without a React Native
 * runtime. Presentation only; nothing here decides what is in a program.
 */
import type { Muscle } from './splitGenerator.ts';

export const MUSCLE_LABEL: Record<Muscle, string> = {
  chest: 'Chest',
  back: 'Back',
  quads: 'Quads',
  hamstrings: 'Hams',
  glutes: 'Glutes',
  shoulders: 'Delts',
  biceps: 'Biceps',
  triceps: 'Triceps',
  core: 'Core',
  calves: 'Calves',
};

export type MuscleCounts = Partial<Record<Muscle, number>>;

/** Sets per muscle for a list of exercises, given a lookup to their rows. */
export function countMuscles(
  exercises: { exerciseId: string; targetSets: number }[],
  primaryMuscleOf: (id: string) => Muscle | undefined
): MuscleCounts {
  const counts: MuscleCounts = {};
  for (const e of exercises) {
    const m = primaryMuscleOf(e.exerciseId);
    if (m) counts[m] = (counts[m] ?? 0) + e.targetSets;
  }
  return counts;
}

/** The `n` biggest muscles, largest first — what the bar and legend both show. */
export function topMuscles(counts: MuscleCounts, n = 4): [Muscle, number][] {
  return (Object.entries(counts) as [Muscle, number][])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

/**
 * "Upper A" -> "Up A", "Full Body A" -> "FB A", "Push" -> "Pu". The week strip
 * cells are ~40px wide, so a label has to survive at two or three characters.
 */
export function shortDayLabel(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const tail = parts.length > 1 && parts[parts.length - 1].length === 1 ? ` ${parts.pop()}` : '';
  return parts.map((w) => w.slice(0, parts.length > 1 ? 1 : 2)).join('') + tail;
}
