import { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Glass, Field } from '@/components/ui';
import { Chip } from '@/components/onboarding';
import { BottomNav } from '@/components/BottomNav';
import { useTheme } from '@/theme/ThemeProvider';

const FILTERS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms'];
const EXERCISES = [
  ['Barbell bench press', 'Chest · barbell', 'dumbbell'],
  ['Incline dumbbell press', 'Chest · dumbbell', 'dumbbell'],
  ['Push-up', 'Chest · bodyweight', 'human-handsup'],
  ['Cable fly', 'Chest · cable', 'cable-data'],
  ['Dips', 'Chest · bodyweight', 'human-handsup'],
];

export default function Library() {
  const { theme } = useTheme();
  const [filter, setFilter] = useState('All');

  return (
    <Screen ambient="green" bottomNav={<BottomNav active="library" />}>
      <Text style={{ fontSize: 20, fontWeight: '700', letterSpacing: -0.4, color: theme.textPrimary }}>Exercises</Text>
      <View style={{ marginTop: 14 }}>
        <Field label="Search 800+ exercises" value="" />
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
        <Glass style={{ paddingHorizontal: 14 }}>
          {EXERCISES.map(([name, meta, icon], i) => (
            <View
              key={name}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 13,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: theme.hairline,
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: theme.fillSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons name={icon as any} size={20} color={theme.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: theme.textPrimary }}>{name}</Text>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>{meta}</Text>
              </View>
              <MaterialCommunityIcons name="plus" size={20} color={theme.textDisabled} />
            </View>
          ))}
        </Glass>
      </ScrollView>
    </Screen>
  );
}
