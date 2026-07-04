import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, FlatList } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Glass, Cap, Title, Sub, TextField, PrimaryButton } from '@/components/ui';
import { Chip } from '@/components/onboarding';
import { useTheme } from '@/theme/ThemeProvider';
import { getProfile } from '@/db/profileRepo';
import {
  completeSession,
  getActiveSession,
  getSessionSets,
  lastPerformance,
  listExercises,
  logSet,
  recentSessions,
  startSession,
  type SessionSummary,
  type SetWithExercise,
} from '@/db/workoutRepo';
import type { Exercise, LoggedSet, WorkoutSession } from '@/db/schema';

export default function Logging() {
  const router = useRouter();
  const { theme } = useTheme();

  const [profileId, setProfileId] = useState<string | null>(null);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [history, setHistory] = useState<SessionSummary[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [picked, setPicked] = useState<Exercise | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [last, setLast] = useState<LoggedSet | null>(null);
  const [sets, setSets] = useState<SetWithExercise[]>([]);

  const [kg, setKg] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [warmup, setWarmup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const profile = await getProfile();
    if (!profile) return;
    setProfileId(profile.id);
    const active = await getActiveSession(profile.id);
    setSession(active);
    if (active) {
      setSets(await getSessionSets(active.id));
      if (exercises.length === 0) setExercises(await listExercises());
    } else {
      setHistory(await recentSessions(profile.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  useEffect(() => {
    if (picked) lastPerformance(picked.id).then(setLast);
    else setLast(null);
  }, [picked]);

  const begin = async () => {
    if (!profileId) return;
    const s = await startSession(profileId);
    setSession(s);
    setSets([]);
    setExercises(await listExercises());
  };

  const submitSet = async () => {
    setError(null);
    if (!session || !picked) return setError('Pick an exercise first.');
    const weightNum = parseFloat(kg);
    const repsNum = parseInt(reps, 10);
    const rpeNum = rpe ? parseFloat(rpe) : undefined;
    if (!(weightNum >= 0)) return setError('Enter the weight in kg (0 for bodyweight).');
    if (!(repsNum >= 1)) return setError('Enter at least 1 rep.');
    if (rpeNum !== undefined && !(rpeNum >= 1 && rpeNum <= 10)) return setError('RPE is 1–10.');
    setBusy(true);
    try {
      await logSet({
        sessionId: session.id,
        exerciseId: picked.id,
        reps: repsNum,
        weightKg: weightNum,
        rpe: rpeNum,
        isWarmup: warmup,
      });
      setSets(await getSessionSets(session.id));
      setLast(await lastPerformance(picked.id));
      setWarmup(false);
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    if (!session) return;
    await completeSession(session.id);
    router.replace({ pathname: '/summary', params: { sessionId: session.id } });
  };

  // ---- no active session: start + history --------------------------------
  if (!session) {
    return (
      <Screen ambient="red">
        <Title style={{ marginTop: 8 }}>Workout</Title>
        <Sub>Start a session, then log every set as you go.</Sub>
        <View style={{ marginTop: 20 }}>
          <PrimaryButton label="Start workout" onPress={begin} />
        </View>

        {history.length > 0 && (
          <>
            <Cap style={{ marginTop: 28, marginBottom: 10 }}>Recent workouts</Cap>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: 10 }}>
                {history.map((h) => (
                  <Glass key={h.session.id} style={{ padding: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textPrimary }}>
                        {h.session.date}
                      </Text>
                      <Text style={{ fontSize: 12, color: theme.textMuted }}>
                        {h.durationMin != null ? `${h.durationMin}m` : ''}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
                      {h.totalSets} sets · {Math.round(h.totalVolumeKg).toLocaleString()} kg volume
                    </Text>
                  </Glass>
                ))}
              </View>
              <View style={{ height: 24 }} />
            </ScrollView>
          </>
        )}
      </Screen>
    );
  }

  // ---- active session: exercise picker + set entry ------------------------
  return (
    <Screen ambient="red">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable onPress={() => router.push('/home')}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={theme.textMuted} />
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textPrimary }}>
            {picked?.name ?? 'Pick an exercise'}
          </Text>
          <Cap>{sets.length} sets this session</Cap>
        </View>
        <Pressable onPress={finish}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.greenText }}>Finish</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <Pressable onPress={() => setPickerOpen(true)}>
          <Glass
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 14,
              marginTop: 16,
            }}
          >
            <Text style={{ fontSize: 14, color: picked ? theme.textPrimary : theme.textMuted }}>
              {picked ? picked.name : 'Choose exercise…'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textMuted} />
          </Glass>
        </Pressable>

        {picked && last && (
          <Text style={{ textAlign: 'center', fontSize: 12, color: theme.textMuted, marginTop: 12 }}>
            last time ·{' '}
            <Text style={{ color: theme.redText }}>
              {last.weightKg} kg × {last.reps}
              {last.rpe != null ? ` @ ${last.rpe}` : ''}
            </Text>
          </Text>
        )}

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <View style={{ flex: 1 }}>
            <TextField label="KG" value={kg} onChangeText={setKg} placeholder="60" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <TextField label="Reps" value={reps} onChangeText={setReps} placeholder="8" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <TextField label="RPE" value={rpe} onChangeText={setRpe} placeholder="8" keyboardType="numeric" />
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <Chip label="Warm-up set" selected={warmup} onPress={() => setWarmup((w) => !w)} />
          {error != null && <Text style={{ flex: 1, fontSize: 12, color: theme.redText }}>{error}</Text>}
        </View>

        <Pressable
          onPress={busy ? undefined : submitSet}
          style={{
            marginTop: 14,
            backgroundColor: theme.green,
            borderRadius: 15,
            paddingVertical: 15,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <MaterialCommunityIcons name="check" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
            {busy ? 'Logging…' : 'Log set'}
          </Text>
        </Pressable>

        {sets.length > 0 && (
          <>
            <Cap style={{ marginTop: 22, marginBottom: 10 }}>This session</Cap>
            <Glass style={{ paddingHorizontal: 14 }}>
              {[...sets].reverse().map((s, i) => (
                <View
                  key={s.id}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 11,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: theme.hairline,
                  }}
                >
                  <Text style={{ fontSize: 13, color: theme.textPrimary }}>
                    {s.exerciseName} · set {s.setIndex}
                    {s.isWarmup ? ' · warm-up' : ''}
                  </Text>
                  <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                    {s.weightKg} kg × {s.reps}
                    {s.rpe != null ? ` @ ${s.rpe}` : ''}
                  </Text>
                </View>
              ))}
            </Glass>
          </>
        )}
      </ScrollView>

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={{ flex: 1, backgroundColor: theme.canvas, paddingTop: 60, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title style={{ fontSize: 20 }}>Pick exercise</Title>
            <Pressable onPress={() => setPickerOpen(false)}>
              <MaterialCommunityIcons name="close" size={24} color={theme.textMuted} />
            </Pressable>
          </View>
          <FlatList
            data={exercises}
            keyExtractor={(e) => e.id}
            style={{ marginTop: 12 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  setPicked(item);
                  setPickerOpen(false);
                }}
                style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.hairline }}
              >
                <Text style={{ fontSize: 15, color: theme.textPrimary }}>{item.name}</Text>
                <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                  {item.primaryMuscle} · {item.difficulty}
                </Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </Screen>
  );
}
