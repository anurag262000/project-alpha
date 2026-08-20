import { useCallback, useState } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Glass, Cap } from '@/components/ui';
import { BottomNav } from '@/components/BottomNav';
import { useTheme } from '@/theme/ThemeProvider';
import { getProfile } from '@/db/profileRepo';
import {
  generateAndSaveProgram,
  getActiveProgram,
  getDayPlan,
  getProgramDays,
  weeklyVolumeByMuscle,
  type MuscleVolume,
  type PlannedExercise,
} from '@/db/programRepo';
import type { Profile, Program, ProgramDay } from '@/db/schema';

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DayView {
  day: ProgramDay;
  exercises: PlannedExercise[];
}

export default function ProgramScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [days, setDays] = useState<DayView[]>([]);
  const [volume, setVolume] = useState<MuscleVolume[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const load = useCallback(async () => {
    const p = await getProfile();
    if (!p) return setLoading(false);
    setProfile(p);

    const active = await getActiveProgram(p.id);
    setProgram(active);
    if (active) {
      const rows = await getProgramDays(active.id);
      setDays(await Promise.all(rows.map(async (day) => ({ day, exercises: await getDayPlan(day.id) }))));
      setVolume(await weeklyVolumeByMuscle(p.id));
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const regenerate = () => {
    if (!profile) return;
    Alert.alert(
      'Regenerate program?',
      'Builds a fresh split from your current profile. Your logged history is kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: async () => {
            setRegenerating(true);
            try {
              await generateAndSaveProgram(profile);
              await load();
            } finally {
              setRegenerating(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <Screen ambient="default" bottomNav={<BottomNav active="program" />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.textMuted} />
        </View>
      </Screen>
    );
  }

  if (!program) {
    return (
      <Screen ambient="default" bottomNav={<BottomNav active="program" />}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: theme.textPrimary, marginTop: 8 }}>Program</Text>
        <Glass style={{ padding: 16, marginTop: 16 }}>
          <Text style={{ fontSize: 14, color: theme.textPrimary }}>No active program</Text>
          <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
            {profile
              ? 'Generation did not complete. Try building it again.'
              : 'Complete onboarding and one will be generated for you.'}
          </Text>
          {profile && (
            <Pressable onPress={regenerate} style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.greenText }}>
                {regenerating ? 'Building…' : 'Generate my program ›'}
              </Text>
            </Pressable>
          )}
        </Glass>
      </Screen>
    );
  }

  const totalPlannedSets = days.reduce(
    (sum, d) => sum + d.exercises.reduce((s, e) => s + e.plan.targetSets, 0),
    0
  );

  return (
    <Screen ambient="default" bottomNav={<BottomNav active="program" />}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', letterSpacing: -0.4, color: theme.textPrimary }}>
              {program.name}
            </Text>
            <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 3 }}>
              {program.daysPerWeek} days · {totalPlannedSets} planned sets a week
            </Text>
          </View>
          <Pressable onPress={regenerating ? undefined : regenerate} style={{ padding: 6 }}>
            <MaterialCommunityIcons
              name="refresh"
              size={20}
              color={regenerating ? theme.textMuted : theme.textPrimary}
            />
          </Pressable>
        </View>

        {/* Week overview — training days and rest days in weekday order */}
        <Cap style={{ marginTop: 20, marginBottom: 10 }}>Your week</Cap>
        <View style={{ gap: 8 }}>
          {DAY_SHORT.map((label, weekday) => {
            const match = days.find((d) => d.day.weekday === weekday);
            if (!match) {
              return (
                <Glass key={label} style={{ padding: 13, opacity: 0.55 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                      <MaterialCommunityIcons name="sleep" size={18} color={theme.textMuted} />
                      <Text style={{ fontSize: 14, color: theme.textSecondary }}>{label}</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>Rest</Text>
                  </View>
                </Glass>
              );
            }

            const open = expanded === match.day.id;
            const sets = match.exercises.reduce((s, e) => s + e.plan.targetSets, 0);
            return (
              <Pressable key={label} onPress={() => setExpanded(open ? null : match.day.id)}>
                <Glass style={{ padding: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', flex: 1 }}>
                      <MaterialCommunityIcons name="dumbbell" size={18} color={theme.red} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textPrimary }}>
                          {match.day.label}
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.textMuted }}>
                          {label} · {match.exercises.length} exercises · {sets} sets
                        </Text>
                      </View>
                    </View>
                    <MaterialCommunityIcons
                      name={open ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={theme.textMuted}
                    />
                  </View>

                  {open && (
                    <View style={{ marginTop: 12, gap: 9 }}>
                      {match.exercises.map(({ plan, exercise, prescription }) => (
                        <View key={plan.id}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ flex: 1, fontSize: 13, color: theme.textPrimary }}>
                              {exercise.name}
                            </Text>
                            <Text style={{ fontSize: 12, color: theme.textSecondary, marginLeft: 10 }}>
                              {plan.targetSets} × {plan.targetRepMin}–{plan.targetRepMax}
                              {plan.targetRpe != null ? ` @${plan.targetRpe}` : ''}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                            {prescription.reason}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Glass>
              </Pressable>
            );
          })}
        </View>

        {/* Plan vs actual, the reason planned and logged rows are separate tables */}
        {volume.length > 0 && (
          <>
            <Cap style={{ marginTop: 24, marginBottom: 10 }}>Weekly volume · logged vs planned</Cap>
            <Glass style={{ padding: 14, gap: 11 }}>
              {volume.map((v) => {
                const pct = v.targetSets > 0 ? Math.min(1, v.sets / v.targetSets) : 0;
                return (
                  <View key={v.muscle}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                      <Text style={{ fontSize: 12, color: theme.textPrimary, textTransform: 'capitalize' }}>
                        {v.muscle}
                      </Text>
                      <Text style={{ fontSize: 12, color: theme.textMuted }}>
                        {v.sets} / {v.targetSets} sets
                      </Text>
                    </View>
                    <View style={{ height: 5, borderRadius: 3, backgroundColor: theme.track, overflow: 'hidden' }}>
                      <View
                        style={{
                          width: `${pct * 100}%`,
                          height: '100%',
                          borderRadius: 3,
                          backgroundColor: pct >= 1 ? theme.green : theme.red,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </Glass>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
