import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Glass, TextField } from '@/components/ui';
import { Chip } from '@/components/onboarding';
import { BottomNav } from '@/components/BottomNav';
import { useTheme } from '@/theme/ThemeProvider';
import { listExercises } from '@/db/workoutRepo';
import type { Exercise } from '@/db/schema';

const FILTERS = ['All', 'Chest', 'Back', 'Quads', 'Hamstrings', 'Glutes', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Calves'];

const ICON_FOR: Record<string, string> = {
  barbell: 'weight-lifter',
  dumbbell: 'dumbbell',
  machine: 'cog-outline',
  bodyweight: 'human-handsup',
  band: 'alpha-s-circle-outline',
  kettlebell: 'kettlebell',
  bench: 'seat-outline',
};

export default function Library() {
  const { theme } = useTheme();
  const [all, setAll] = useState<Exercise[]>([]);
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listExercises().then((rows) => {
      setAll(rows);
      setLoading(false);
    });
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((ex) => {
      const matchesMuscle = filter === 'All' || ex.primaryMuscle === filter.toLowerCase();
      const matchesQuery =
        q === '' ||
        ex.name.toLowerCase().includes(q) ||
        ex.primaryMuscle.includes(q) ||
        ex.equipment.some((e) => e.includes(q));
      return matchesMuscle && matchesQuery;
    });
  }, [all, filter, query]);

  return (
    <Screen ambient="green" bottomNav={<BottomNav active="library" />}>
      <Text style={{ fontSize: 20, fontWeight: '700', letterSpacing: -0.4, color: theme.textPrimary }}>
        Exercises
      </Text>
      <View style={{ marginTop: 14 }}>
        <TextField
          label={`Search ${all.length} exercises`}
          value={query}
          onChangeText={setQuery}
          placeholder="Bench, squat, dumbbell…"
          autoCorrect={false}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 16 }}
      >
        {FILTERS.map((f) => (
          <Chip key={f} label={f} selected={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={theme.textMuted} />
      ) : shown.length === 0 ? (
        <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 8 }}>
          Nothing matches “{query}”.
        </Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
          <Glass style={{ paddingHorizontal: 14 }}>
            {shown.map((ex, i) => (
              <View
                key={ex.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: theme.hairline,
                }}
              >
                <MaterialCommunityIcons
                  name={(ICON_FOR[ex.equipment[0]] ?? 'dumbbell') as any}
                  size={20}
                  color={theme.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, color: theme.textPrimary }}>{ex.name}</Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2, textTransform: 'capitalize' }}>
                    {ex.primaryMuscle} · {ex.equipment.join(', ')}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: theme.textMuted, textTransform: 'capitalize' }}>
                  {ex.difficulty}
                </Text>
              </View>
            ))}
          </Glass>
        </ScrollView>
      )}
    </Screen>
  );
}
