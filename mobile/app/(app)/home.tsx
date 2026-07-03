import { ScrollView, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Glass, Cap, PrimaryButton } from '@/components/ui';
import { BottomNav } from '@/components/BottomNav';
import { ActivityRings } from '@/components/charts';
import { useTheme } from '@/theme/ThemeProvider';

const WORKOUT = [
  ['Bench press', '4 × 6–8'],
  ['Barbell row', '4 × 8–10'],
  ['Overhead press', '3 × 8–10'],
];

export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <Screen ambient="default" bottomNav={<BottomNav active="home" />}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Cap>Wednesday · upper A</Cap>
            <Text style={{ fontSize: 22, fontWeight: '700', letterSpacing: -0.4, color: theme.textPrimary, marginTop: 3, lineHeight: 27 }}>
              {'Good evening,\nAnurag'}
            </Text>
          </View>
          <Glass style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 12 }} r={20}>
            <MaterialCommunityIcons name="fire" size={16} color={theme.red} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textPrimary }}>12</Text>
          </Glass>
        </View>

        <Glass style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, marginTop: 18 }}>
          <ActivityRings />
          <View>
            <Text style={{ fontSize: 24, fontWeight: '700', letterSpacing: -0.4, color: theme.textPrimary }}>
              7,420<Text style={{ fontSize: 13, fontWeight: '400', color: theme.textMuted }}> steps</Text>
            </Text>
            <Text style={{ fontSize: 12, color: theme.greenText, marginTop: 2 }}>74% of 10k goal</Text>
            <Text style={{ fontSize: 12, color: theme.redText, marginTop: 6 }}>38 active min</Text>
          </View>
        </Glass>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10 }}>
          <Cap>Today's workout</Cap>
          <Text style={{ fontSize: 12, color: theme.textMuted }}>5 exercises · ~48 min</Text>
        </View>
        <Glass style={{ paddingHorizontal: 14 }}>
          {WORKOUT.map(([name, sets], i) => (
            <Pressable
              key={name}
              onPress={() => router.push('/logging')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 13,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: theme.hairline,
              }}
            >
              <Text style={{ fontSize: 13, color: theme.textMuted, width: 16 }}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: theme.textPrimary }}>{name}</Text>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>{sets}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textDisabled} />
            </Pressable>
          ))}
        </Glass>

        <View style={{ marginTop: 16 }}>
          <PrimaryButton label="Start workout" onPress={() => router.push('/logging')} />
        </View>
      </ScrollView>
    </Screen>
  );
}
