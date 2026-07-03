import { create } from 'zustand';
import {
  computeTargets,
  type Sex,
  type Goal,
  type ActivityLevel,
  type LifestyleActivity,
  type TargetsBundle,
} from '@/lib/health';

export type Experience = 'new' | 'under_1yr' | '1_3yr' | '3yr_plus';
export type Equipment = 'home_minimal' | 'home_full' | 'gym';
export type PreferredTime = 'morning' | 'midday' | 'evening' | 'flexible';

/** Draft profile collected across the onboarding flow. All optional until set. */
export interface OnboardingDraft {
  sex?: Sex;
  dateOfBirth?: string; // ISO
  heightCm?: number;
  weightKg?: number;
  weightAccuracy?: 'estimated' | 'measured';
  goal?: Goal;
  experienceLevel?: Experience;
  lifestyleActivity?: LifestyleActivity;
  trainingDays?: number[]; // 0=Sun..6=Sat
  sessionLengthMin?: number;
  preferredTime?: PreferredTime;
  equipmentAccess?: Equipment;
  parqAnswers?: boolean[];
  injuries?: string[];
}

interface OnboardingState {
  draft: OnboardingDraft;
  set: (patch: Partial<OnboardingDraft>) => void;
  reset: () => void;
  /** Derived nutrition targets, or null until the required fields are present. */
  targets: () => TargetsBundle | null;
}

const requiredForTargets = (d: OnboardingDraft) =>
  d.sex && d.dateOfBirth && d.heightCm && d.weightKg && d.goal && d.lifestyleActivity;

export const useOnboarding = create<OnboardingState>((set, get) => ({
  draft: { weightAccuracy: 'estimated' },
  set: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  reset: () => set({ draft: { weightAccuracy: 'estimated' } }),
  targets: () => {
    const d = get().draft;
    if (!requiredForTargets(d)) return null;
    const ageYears = ageFromIso(d.dateOfBirth!);
    const activity = suggestFromDraft(d);
    return computeTargets({
      sex: d.sex!,
      weightKg: d.weightKg!,
      heightCm: d.heightCm!,
      ageYears,
      goal: d.goal!,
      activity,
    });
  },
}));

function ageFromIso(iso: string): number {
  const dob = new Date(iso);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

function suggestFromDraft(d: OnboardingDraft): ActivityLevel {
  const order: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'very', 'extra'];
  const base = order.indexOf((d.lifestyleActivity ?? 'moderate') as ActivityLevel);
  const bump = (d.trainingDays?.length ?? 0) >= 5 ? base + 1 : base;
  return order[Math.min(bump, order.length - 1)];
}
