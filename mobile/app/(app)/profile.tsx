import { ScrollView, View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Glass, Cap } from '@/components/ui';
import { BottomNav } from '@/components/BottomNav';
import { useTheme } from '@/theme/ThemeProvider';

export default function Profile() {
  const { theme, name, toggle } = useTheme();

  const Row = ({
    icon,
    label,
    right,
    onPress,
  }: {
    icon: any;
    label: string;
    right: React.ReactNode;
    onPress?: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderTopWidth: 1, borderTopColor: theme.hairline }}
    >
      <MaterialCommunityIcons name={icon} size={20} color={theme.textSecondary} />
      <Text style={{ flex: 1, fontSize: 14, color: theme.textPrimary }}>{label}</Text>
      {right}
    </Pressable>
  );

  const muted = (t: string) => <Text style={{ fontSize: 13, color: theme.textMuted }}>{t}</Text>;

  return (
    <Screen ambient="red" bottomNav={<BottomNav active="profile" />}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center', marginTop: 4 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: theme.ink,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: '700', color: theme.onInk }}>AM</Text>
          </View>
          <View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textPrimary }}>Anurag Mishra</Text>
            <Text style={{ fontSize: 13, color: theme.textMuted }}>Fat loss · 1–3 yrs · Upper/Lower</Text>
          </View>
        </View>

        <Glass style={{ flexDirection: 'row', paddingVertical: 16, marginTop: 18 }}>
          {[
            ['81.6', 'kg'],
            ['178', 'cm'],
            ['42', 'workouts'],
          ].map(([v, l], i) => (
            <View
              key={l}
              style={{
                flex: 1,
                alignItems: 'center',
                borderLeftWidth: i === 0 ? 0 : 1,
                borderColor: theme.hairline,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textPrimary }}>{v}</Text>
              <Cap style={{ marginTop: 2 }}>{l}</Cap>
            </View>
          ))}
        </Glass>

        <Cap style={{ marginTop: 20, marginBottom: 10 }}>Settings</Cap>
        <Glass style={{ paddingHorizontal: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 }}>
            <MaterialCommunityIcons name="ruler" size={20} color={theme.textSecondary} />
            <Text style={{ flex: 1, fontSize: 14, color: theme.textPrimary }}>Units</Text>
            {muted('Metric')}
          </View>
          <Row icon="heart-pulse" label="Health Connect" right={<Text style={{ fontSize: 13, color: theme.greenText }}>Connected</Text>} />
          <Row icon="bell-outline" label="Reminders" right={muted('7:00 PM')} />
          <Row
            icon="theme-light-dark"
            label="Appearance"
            onPress={toggle}
            right={muted(name === 'dark' ? 'Dark' : 'Light')}
          />
          <Row icon="download" label="Export data" right={<MaterialCommunityIcons name="chevron-right" size={20} color={theme.textDisabled} />} />
        </Glass>
      </ScrollView>
    </Screen>
  );
}
