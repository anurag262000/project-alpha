import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Glass, Cap, Title, Sub, PrimaryButton } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { sessionPrs, summarizeSession, type SessionSummary } from '@/db/workoutRepo';

export default function Summary() {
  const router = useRouter();
  const { theme } = useTheme();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();

  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [prs, setPrs] = useState<{ exerciseName: string; weightKg: number; reps: number }[]>([]);

  useEffect(() => {
    if (!sessionId) return;
    summarizeSession(sessionId).then(setSummary);
    sessionPrs(sessionId).then(setPrs);
  }, [sessionId]);

  const stats: [string, string][] = summary
    ? [
        [`${Math.round(summary.totalVolumeKg).toLocaleString()}`, 'volume kg'],
        [summary.durationMin != null ? `${summary.durationMin}m` : '—', 'duration'],
        [`${summary.totalSets}`, 'sets'],
      ]
    : [];

  return (
    <Screen ambient="green">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: theme.green,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name="check" size={40} color="#fff" />
        </View>
        <Title style={{ marginTop: 20 }}>Workout done</Title>
        <Sub>{summary ? `Logged ${summary.session.date}.` : 'Nice work.'}</Sub>

        {stats.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 24, alignSelf: 'stretch' }}>
            {stats.map(([v, l]) => (
              <Glass key={l} style={{ flex: 1, alignItems: 'center', paddingVertical: 14 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: theme.textPrimary }}>{v}</Text>
                <Cap style={{ marginTop: 2 }}>{l}</Cap>
              </Glass>
            ))}
          </View>
        )}

        {prs.map((pr) => (
          <View
            key={pr.exerciseName}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginTop: 16,
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 20,
              backgroundColor: 'rgba(251,44,54,0.15)',
            }}
          >
            <MaterialCommunityIcons name="trophy-variant" size={14} color={theme.redText} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.redText }}>
              New PR · {pr.exerciseName} {pr.weightKg} kg × {pr.reps}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ paddingBottom: 8 }}>
        <PrimaryButton label="Done" onPress={() => router.replace('/home')} />
      </View>
    </Screen>
  );
}
