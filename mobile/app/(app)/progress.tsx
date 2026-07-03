import { ScrollView, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Glass, Cap } from '@/components/ui';
import { BottomNav } from '@/components/BottomNav';
import { TrendLine } from '@/components/charts';
import { useTheme } from '@/theme/ThemeProvider';

export default function Progress() {
  const { theme } = useTheme();
  const bars = [
    { h: 62, c: theme.red, label: 'Chest' },
    { h: 76, c: theme.green, label: 'Back' },
    { h: 48, c: theme.track, label: 'Legs' },
    { h: 38, c: theme.track, label: 'Delts' },
    { h: 30, c: theme.track, label: 'Arms' },
  ];

  return (
    <Screen ambient="default" bottomNav={<BottomNav active="progress" />}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', letterSpacing: -0.4, color: theme.textPrimary }}>Progress</Text>
          <Glass style={{ paddingVertical: 7, paddingHorizontal: 13 }} r={20}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: theme.textPrimary }}>3 months</Text>
          </Glass>
        </View>

        <Glass style={{ padding: 16, marginTop: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Cap>Bodyweight</Cap>
            <Text style={{ fontSize: 12, color: theme.greenText }}>↘ −3.2 kg</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
            <Text style={{ fontSize: 26, fontWeight: '700', letterSpacing: -0.4, color: theme.textPrimary }}>78.4</Text>
            <Text style={{ fontSize: 13, color: theme.textMuted }}>kg</Text>
          </View>
          <View style={{ marginTop: 8 }}>
            <TrendLine />
          </View>
        </Glass>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
          <Glass style={{ flex: 1, padding: 14 }}>
            <Cap>Bench 1RM</Cap>
            <Text style={{ fontSize: 20, fontWeight: '700', color: theme.textPrimary, marginTop: 4 }}>
              84 <Text style={{ fontSize: 12, fontWeight: '400', color: theme.textMuted }}>kg</Text>
            </Text>
            <Text style={{ fontSize: 12, color: theme.greenText, marginTop: 2 }}>+9 kg</Text>
          </Glass>
          <Glass style={{ flex: 1, padding: 14 }}>
            <Cap>Adherence</Cap>
            <Text style={{ fontSize: 20, fontWeight: '700', color: theme.textPrimary, marginTop: 4 }}>
              92<Text style={{ fontSize: 12, fontWeight: '400', color: theme.textMuted }}>%</Text>
            </Text>
            <Text style={{ fontSize: 12, color: theme.greenText, marginTop: 2 }}>22 / 24 sessions</Text>
          </Glass>
        </View>

        <Cap style={{ marginTop: 18, marginBottom: 10 }}>Weekly volume by muscle</Cap>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 88, paddingHorizontal: 4 }}>
          {bars.map((b) => (
            <View key={b.label} style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ width: '100%', height: b.h, backgroundColor: b.c, borderRadius: 8 }} />
              <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 6 }}>{b.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
