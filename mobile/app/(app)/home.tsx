import { useCallback, useState } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Glass, Cap, PrimaryButton } from '@/components/ui';
import { BottomNav } from '@/components/BottomNav';
import { ActivityRings } from '@/components/charts';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/store/auth';
import { getProfile } from '@/db/profileRepo';
import {
  currentStreak,
  getProgramStatus,
  getTodaysWorkout,
  type ProgramStatus,
  type TodaysWorkout,
} from '@/db/programRepo';
import { getActiveSession } from '@/db/workoutRepo';
import { syncToday } from '@/db/activityRepo';
import {
  DAILY_POINTS_GOAL,
  DAILY_STEP_GOAL,
  getState,
  requestAccess,
  type HealthConnectState,
} from '@/lib/healthConnect';
import type { ActivitySnapshot, Profile } from '@/db/schema';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** No name field on the profile yet — derive a friendly one from the account email. */
function displayName(email: string | undefined): string {
  const local = email?.split('@')[0] ?? '';
  const cleaned = local.replace(/[._\-0-9]+/g, ' ').trim();
  if (!cleaned) return 'there';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();
  const user = useAuth((s) => s.user);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [today, setToday] = useState<TodaysWorkout | null>(null);
  const [status, setStatus] = useState<ProgramStatus | null>(null);
  const [activity, setActivity] = useState<ActivitySnapshot | null>(null);
  const [hcState, setHcState] = useState<HealthConnectState>('unsupported');
  const [streak, setStreak] = useState(0);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const p = await getProfile();
    if (!p) return setLoading(false);
    setProfile(p);

    const [workout, programStatus, streakDays, active] = await Promise.all([
      getTodaysWorkout(p.id),
      getProgramStatus(p.id, p),
      currentStreak(p.id, p.trainingDays),
      getActiveSession(p.id),
    ]);
    setToday(workout);
    setStatus(programStatus);
    setStreak(streakDays);
    setHasActiveSession(active !== null);

    const hc = await getState();
    setHcState(hc);
    setActivity(await syncToday(p.id));
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const connectHealth = async () => {
    const next = await requestAccess();
    setHcState(next);
    if (profile && next === 'available') setActivity(await syncToday(profile.id));
  };

  if (loading) {
    return (
      <Screen ambient="default" bottomNav={<BottomNav active="home" />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.textMuted} />
        </View>
      </Screen>
    );
  }

  const now = new Date();
  const steps = activity?.steps ?? 0;
  const points = activity?.points ?? 0;
  const activeMinutes = activity?.activeMinutes ?? 0;
  const dayLabel = today?.day?.label ?? 'Rest day';

  return (
    <Screen ambient="default" bottomNav={<BottomNav active="home" />}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Cap>
              {DAY_NAMES[now.getDay()]}
              {today && !today.isRestDay ? ` · ${dayLabel}` : ''}
            </Cap>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '700',
                letterSpacing: -0.4,
                color: theme.textPrimary,
                marginTop: 3,
                lineHeight: 27,
              }}
            >
              {`${greeting(now.getHours())},\n${displayName(user?.email)}`}
            </Text>
          </View>
          {streak > 0 && (
            <Glass
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 12 }}
              r={20}
            >
              <MaterialCommunityIcons name="fire" size={16} color={theme.red} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textPrimary }}>{streak}</Text>
            </Glass>
          )}
        </View>

        {/* Activity ring */}
        <Glass style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, marginTop: 18 }}>
          <ActivityRings
            stepProgress={steps / DAILY_STEP_GOAL}
            pointProgress={points / DAILY_POINTS_GOAL}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', letterSpacing: -0.4, color: theme.textPrimary }}>
              {steps.toLocaleString()}
              <Text style={{ fontSize: 13, fontWeight: '400', color: theme.textMuted }}> steps</Text>
            </Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
              {points} points · {activeMinutes} active min
            </Text>
            {hcState !== 'available' && (
              <Pressable onPress={connectHealth} style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.greenText }}>
                  {hcState === 'needs_permission'
                    ? 'Allow Health Connect ›'
                    : hcState === 'needs_install'
                      ? 'Set up Health Connect ›'
                      : 'Steps sync needs an Android device build'}
                </Text>
              </Pressable>
            )}
          </View>
        </Glass>

        {/* Program adjustments — deload / adherence (docs/02 step 5) */}
        {status?.deload.due && (
          <Banner icon="bed" tone={theme.red} text={status.deload.reason!} theme={theme} />
        )}
        {!status?.deload.due && status?.adherence.action !== 'none' && status && (
          <Banner icon="tune-variant" tone={theme.textMuted} text={status.adherence.message} theme={theme} />
        )}

        {/* Today's workout */}
        <Cap style={{ marginTop: 22, marginBottom: 10 }}>Today</Cap>

        {today === null ? (
          <Glass style={{ padding: 16 }}>
            <Text style={{ fontSize: 14, color: theme.textPrimary }}>No program yet</Text>
            <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
              Finish onboarding to generate your split.
            </Text>
          </Glass>
        ) : today.isRestDay ? (
          <Glass style={{ padding: 16, alignItems: 'flex-start' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="sleep" size={20} color={theme.greenText} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textPrimary }}>Rest day</Text>
            </View>
            <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>
              Nothing scheduled. Recovery is part of the program — but you can still train off-plan.
            </Text>
            <Pressable onPress={() => router.push('/logging')} style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.greenText }}>
                Start an ad-hoc workout ›
              </Text>
            </Pressable>
          </Glass>
        ) : (
          <>
            <Pressable onPress={() => router.push('/logging')}>
              <Glass style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textPrimary }}>{dayLabel}</Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>
                    {today.exercises.length} exercises
                  </Text>
                </View>
                <View style={{ gap: 9, marginTop: 12 }}>
                  {today.exercises.map(({ plan, exercise, prescription }) => (
                    <View
                      key={plan.id}
                      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <Text style={{ flex: 1, fontSize: 14, color: theme.textPrimary }} numberOfLines={1}>
                        {exercise.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: theme.textSecondary, marginLeft: 10 }}>
                        {plan.targetSets} × {plan.targetRepMin}–{plan.targetRepMax}
                        {prescription.weightKg != null ? ` · ${prescription.weightKg}kg` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              </Glass>
            </Pressable>
            <View style={{ marginTop: 14 }}>
              <PrimaryButton
                label={hasActiveSession ? 'Continue workout' : 'Start workout'}
                onPress={() => router.push('/logging')}
              />
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function Banner({
  icon,
  tone,
  text,
  theme,
}: {
  icon: any;
  tone: string;
  text: string;
  theme: any;
}) {
  return (
    <Glass style={{ flexDirection: 'row', gap: 10, padding: 12, marginTop: 12, alignItems: 'flex-start' }}>
      <MaterialCommunityIcons name={icon} size={18} color={tone} />
      <Text style={{ flex: 1, fontSize: 12, color: theme.textSecondary, lineHeight: 17 }}>{text}</Text>
    </Glass>
  );
}
