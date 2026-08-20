/**
 * Health Connect bridge — passive steps + active minutes (docs/01
 * ActivitySnapshot). Android only; every entry point degrades to an
 * "unavailable" result rather than throwing, so the app still runs on iOS,
 * in Expo Go, on emulators without Health Connect, and before the user has
 * granted anything.
 *
 * Reads only. We never write to Health Connect.
 */
import { Platform } from 'react-native';

export type HealthConnectState =
  | 'available'      // installed, initialized, permissions granted
  | 'needs_permission'
  | 'needs_install'  // Health Connect app missing or needs an update
  | 'unsupported';   // not Android, or no native module (Expo Go)

export interface ActivityReading {
  steps: number;
  activeMinutes: number;
}

/** Read permissions we ask for — nothing beyond what the activity ring needs. */
const PERMISSIONS = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'ExerciseSession' },
] as const;

type HealthConnectModule = typeof import('react-native-health-connect');

/**
 * Loaded lazily: the native module is absent in Expo Go and on iOS, and a
 * top-level import would crash those before any of our code runs.
 */
function loadModule(): HealthConnectModule | null {
  if (Platform.OS !== 'android') return null;
  try {
    return require('react-native-health-connect') as HealthConnectModule;
  } catch {
    return null;
  }
}

const SDK_AVAILABLE = 3;

export async function getState(): Promise<HealthConnectState> {
  const hc = loadModule();
  if (!hc) return 'unsupported';
  try {
    const status = await hc.getSdkStatus();
    if (status !== SDK_AVAILABLE) return 'needs_install';
    if (!(await hc.initialize())) return 'needs_install';
    const granted = await hc.getGrantedPermissions();
    const hasSteps = granted.some(
      (p) => 'recordType' in p && p.recordType === 'Steps' && p.accessType === 'read'
    );
    return hasSteps ? 'available' : 'needs_permission';
  } catch {
    return 'unsupported';
  }
}

/** Opens the Health Connect permission sheet. Returns the resulting state. */
export async function requestAccess(): Promise<HealthConnectState> {
  const hc = loadModule();
  if (!hc) return 'unsupported';
  try {
    const status = await hc.getSdkStatus();
    if (status !== SDK_AVAILABLE) return 'needs_install';
    if (!(await hc.initialize())) return 'needs_install';
    await hc.requestPermission(PERMISSIONS as unknown as Parameters<typeof hc.requestPermission>[0]);
    return await getState();
  } catch {
    return 'unsupported';
  }
}

/** Sends the user to the Health Connect app to install/fix or change grants. */
export function openSettings(): void {
  loadModule()?.openHealthConnectSettings();
}

function dayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    operator: 'between' as const,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
}

/**
 * Steps and active minutes for one calendar day. Returns null when Health
 * Connect cannot answer — callers keep whatever was last synced instead of
 * overwriting real data with zeroes.
 */
export async function readDay(date: Date = new Date()): Promise<ActivityReading | null> {
  const hc = loadModule();
  if (!hc) return null;
  try {
    if (!(await hc.initialize())) return null;
    const timeRangeFilter = dayRange(date);

    const steps = await hc
      .aggregateRecord({ recordType: 'Steps', timeRangeFilter })
      .then((r) => r.COUNT_TOTAL ?? 0)
      .catch(() => 0);

    // Health Connect has no "active minutes" record; total logged exercise
    // duration is the closest equivalent to Google Fit's Move Minutes.
    const activeSeconds = await hc
      .aggregateRecord({ recordType: 'ExerciseSession', timeRangeFilter })
      .then((r) => r.EXERCISE_DURATION_TOTAL?.inSeconds ?? 0)
      .catch(() => 0);

    return { steps: Math.round(steps), activeMinutes: Math.round(activeSeconds / 60) };
  } catch {
    return null;
  }
}

/**
 * Gamified daily score. Not in the spec, so it is defined here and kept
 * deliberately legible: 100 steps = 1 point, 1 active minute = 2 points,
 * which puts a 10k-step day with 30 minutes of exercise at ~160 against a
 * 100-point daily goal.
 */
export const DAILY_POINTS_GOAL = 100;
export const DAILY_STEP_GOAL = 10_000;

export function activityPoints(steps: number, activeMinutes: number): number {
  return Math.floor(steps / 100) + activeMinutes * 2;
}
