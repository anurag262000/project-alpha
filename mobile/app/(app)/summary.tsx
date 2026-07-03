import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Glass, Cap, Title, Sub, PrimaryButton } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';

const STATS = [
  ['7.2k', 'volume kg'],
  ['52m', 'duration'],
  ['24', 'sets'],
];

export default function Summary() {
  const router = useRouter();
  const { theme } = useTheme();

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
        <Title style={{ marginTop: 20 }}>Upper A done</Title>
        <Sub>Nice work — that's 3 sessions this week.</Sub>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 24, alignSelf: 'stretch' }}>
          {STATS.map(([v, l]) => (
            <Glass key={l} style={{ flex: 1, alignItems: 'center', paddingVertical: 14 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: theme.textPrimary }}>{v}</Text>
              <Cap style={{ marginTop: 2 }}>{l}</Cap>
            </Glass>
          ))}
        </View>

        <View
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
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.redText }}>New PR · Bench 62.5 kg × 8</Text>
        </View>
      </View>
      <View style={{ paddingBottom: 8 }}>
        <PrimaryButton label="Done" onPress={() => router.replace('/home')} />
      </View>
    </Screen>
  );
}
