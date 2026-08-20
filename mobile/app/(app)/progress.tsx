import { useCallback, useState } from 'react';
import { ScrollView, View, Text, Pressable, Modal, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Glass, Cap, TextField, PrimaryButton, Title } from '@/components/ui';
import { BottomNav } from '@/components/BottomNav';
import { TrendLine } from '@/components/charts';
import { useTheme } from '@/theme/ThemeProvider';
import { addMeasurement, getProfile, measurementHistory } from '@/db/profileRepo';
import { getProgramStatus, weeklyVolumeByMuscle, type MuscleVolume, type ProgramStatus } from '@/db/programRepo';
import { recentSessions, type SessionSummary } from '@/db/workoutRepo';
import { weekOfActivity } from '@/db/activityRepo';
import { bmiCategory } from '@/lib/health';
import type { BodyMeasurement, Profile } from '@/db/schema';

export default function Progress() {
  const { theme } = useTheme();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [weights, setWeights] = useState<BodyMeasurement[]>([]);
  const [volume, setVolume] = useState<MuscleVolume[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [status, setStatus] = useState<ProgramStatus | null>(null);
  const [steps, setSteps] = useState<{ date: string; steps: number }[]>([]);
  const [weighIn, setWeighIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const p = await getProfile();
    if (!p) return setLoading(false);
    setProfile(p);
    const [w, v, s, st, act] = await Promise.all([
      measurementHistory(p.id),
      weeklyVolumeByMuscle(p.id),
      recentSessions(p.id, 8),
      getProgramStatus(p.id, p),
      weekOfActivity(p.id),
    ]);
    setWeights(w);
    setVolume(v);
    setSessions(s);
    setStatus(st);
    setSteps(act.map((a) => ({ date: a.date, steps: a.steps })));
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <Screen ambient="default" bottomNav={<BottomNav active="progress" />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.textMuted} />
        </View>
      </Screen>
    );
  }

  const latest = weights[weights.length - 1] ?? null;
  const first = weights[0] ?? null;
  const delta = latest && first ? latest.weightKg - first.weightKg : 0;
  const totalVolume = sessions.reduce((s, x) => s + x.totalVolumeKg, 0);

  return (
    <Screen ambient="default" bottomNav={<BottomNav active="progress" />}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', letterSpacing: -0.4, color: theme.textPrimary }}>
            Progress
          </Text>
          {status && (
            <Glass style={{ paddingVertical: 7, paddingHorizontal: 13 }} r={20}>
              <Text style={{ fontSize: 12, fontWeight: '500', color: theme.textPrimary }}>
                Week {status.weeksOnProgram + 1}
              </Text>
            </Glass>
          )}
        </View>

        {/* Bodyweight */}
        <Glass style={{ padding: 16, marginTop: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Cap>Bodyweight</Cap>
            {weights.length > 1 && (
              <Text style={{ fontSize: 12, color: delta <= 0 ? theme.greenText : theme.redText }}>
                {delta <= 0 ? '↘' : '↗'} {delta > 0 ? '+' : '−'}
                {Math.abs(delta).toFixed(1)} kg
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
            <Text style={{ fontSize: 26, fontWeight: '700', letterSpacing: -0.4, color: theme.textPrimary }}>
              {latest ? latest.weightKg.toFixed(1) : '—'}
            </Text>
            <Text style={{ fontSize: 13, color: theme.textMuted }}>kg</Text>
            {latest?.bmi != null && (
              <Text style={{ fontSize: 12, color: theme.textMuted, marginLeft: 6 }}>
                BMI {latest.bmi.toFixed(1)} · {bmiCategory(latest.bmi)}
              </Text>
            )}
          </View>
          <View style={{ marginTop: 8 }}>
            <TrendLine values={weights.map((w) => w.weightKg)} color={delta <= 0 ? theme.green : theme.red} />
          </View>
          <Pressable onPress={() => setWeighIn(true)} style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.greenText }}>Log today's weight ›</Text>
          </Pressable>
          {weights.length < 2 && (
            <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 6 }}>
              Log a second weigh-in to start the trend.
            </Text>
          )}
        </Glass>

        {/* Steps */}
        <Glass style={{ padding: 16, marginTop: 12 }}>
          <Cap>Steps · last 7 days</Cap>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 70, marginTop: 12 }}>
            {steps.map((d) => {
              const max = Math.max(...steps.map((x) => x.steps), 1);
              return (
                <View key={d.date} style={{ flex: 1, alignItems: 'center', gap: 5 }}>
                  <View
                    style={{
                      width: '100%',
                      height: Math.max(3, (d.steps / max) * 52),
                      borderRadius: 4,
                      backgroundColor: d.steps > 0 ? theme.green : theme.track,
                    }}
                  />
                  <Text style={{ fontSize: 9, color: theme.textMuted }}>
                    {new Date(d.date).toLocaleDateString(undefined, { weekday: 'narrow' })}
                  </Text>
                </View>
              );
            })}
          </View>
          {steps.every((d) => d.steps === 0) && (
            <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 8 }}>
              No step data yet — connect Health Connect from the Home screen.
            </Text>
          )}
        </Glass>

        {/* Weekly training volume, logged against plan */}
        {volume.length > 0 && (
          <Glass style={{ padding: 16, marginTop: 12 }}>
            <Cap>Volume this week · sets per muscle</Cap>
            <View
              style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 92, marginTop: 14 }}
            >
              {volume.slice(0, 6).map((v) => {
                const max = Math.max(...volume.map((x) => Math.max(x.targetSets, x.sets)), 1);
                const hit = v.targetSets > 0 && v.sets >= v.targetSets;
                return (
                  <View key={v.muscle} style={{ flex: 1, alignItems: 'center', gap: 5 }}>
                    <Text style={{ fontSize: 10, color: theme.textMuted }}>{v.sets}</Text>
                    <View
                      style={{
                        width: '100%',
                        height: Math.max(3, (v.sets / max) * 56),
                        borderRadius: 4,
                        backgroundColor: hit ? theme.green : v.sets > 0 ? theme.red : theme.track,
                      }}
                    />
                    <Text style={{ fontSize: 9, color: theme.textMuted, textTransform: 'capitalize' }}>
                      {v.muscle.slice(0, 5)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Glass>
        )}

        {/* Adherence */}
        {status && (
          <Glass style={{ padding: 16, marginTop: 12 }}>
            <Cap>Adherence · last 2 weeks</Cap>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: theme.textPrimary }}>
                {Math.round(status.adherence.rate * 100)}%
              </Text>
              <Text style={{ fontSize: 12, color: theme.textMuted }}>
                {status.completedSessions} of {status.plannedSessions} sessions
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 8, lineHeight: 17 }}>
              {status.deload.due ? status.deload.reason : status.adherence.message}
            </Text>
          </Glass>
        )}

        {/* Session history */}
        {sessions.length > 0 && (
          <>
            <Cap style={{ marginTop: 22, marginBottom: 10 }}>
              Recent workouts · {Math.round(totalVolume).toLocaleString()} kg moved
            </Cap>
            <Glass style={{ paddingHorizontal: 14 }}>
              {sessions.map((s, i) => (
                <View
                  key={s.session.id}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 11,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: theme.hairline,
                  }}
                >
                  <Text style={{ fontSize: 13, color: theme.textPrimary }}>{s.session.date}</Text>
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                    {s.totalSets} sets · {Math.round(s.totalVolumeKg).toLocaleString()} kg
                    {s.durationMin != null ? ` · ${s.durationMin}m` : ''}
                  </Text>
                </View>
              ))}
            </Glass>
          </>
        )}
      </ScrollView>

      <WeighInModal
        open={weighIn}
        profile={profile}
        initial={latest?.weightKg}
        onClose={() => setWeighIn(false)}
        onSaved={async () => {
          setWeighIn(false);
          await load();
        }}
      />
    </Screen>
  );
}

function WeighInModal({
  open,
  profile,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  profile: Profile | null;
  initial?: number;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { theme } = useTheme();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const kg = parseFloat(value);
    if (!(kg > 20 && kg < 400)) return setError('Enter a weight between 20 and 400 kg.');
    if (!profile) return;
    await addMeasurement(profile, kg, 'measured');
    setValue('');
    setError(null);
    await onSaved();
  };

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' }}>
        <View style={{ backgroundColor: theme.canvas, padding: 20, paddingBottom: 36, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title style={{ fontSize: 19 }}>Today's weight</Title>
            <Pressable onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color={theme.textMuted} />
            </Pressable>
          </View>
          <View style={{ marginTop: 16 }}>
            <TextField
              label="KG"
              value={value}
              onChangeText={(t) => {
                setValue(t);
                setError(null);
              }}
              placeholder={initial ? initial.toFixed(1) : '78.0'}
              keyboardType="decimal-pad"
              error={error ?? undefined}
            />
          </View>
          <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 10 }}>
            Saving also refreshes your calorie and macro targets.
          </Text>
          <View style={{ marginTop: 16 }}>
            <PrimaryButton label="Save" onPress={save} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
