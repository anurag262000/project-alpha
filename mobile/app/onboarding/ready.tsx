import { ScrollView, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Glass, Cap, Title, Sub, PrimaryButton } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';

const WEEK = [
  ['Mon · Upper A', '6 exercises'],
  ['Wed · Lower A', '5 exercises'],
  ['Fri · Upper B', '6 exercises'],
  ['Sat · Lower B', '5 exercises'],
];
const MACROS = [
  ['163g', 'protein'],
  ['62g', 'fat'],
  ['254g', 'carbs'],
];

export default function Ready() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <Screen ambient="default">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <View
          style={{
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 20,
            backgroundColor: 'rgba(16,185,129,0.15)',
            marginTop: 6,
          }}
        >
          <MaterialCommunityIcons name="creation" size={14} color={theme.greenText} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.greenText }}>Your plan is ready</Text>
        </View>

        <Title style={{ fontSize: 26, marginTop: 16, lineHeight: 32 }}>{'Upper / Lower\n· 4 days · fat loss'}</Title>
        <Sub>
          4 days a week with 1–3 years experience → an upper/lower split blending strength and hypertrophy, tuned
          for a fat-loss phase.
        </Sub>

        <Glass style={{ padding: 14, marginTop: 22 }}>
          <Cap style={{ marginBottom: 12 }}>Your week</Cap>
          <View style={{ gap: 8 }}>
            {WEEK.map(([d, n]) => (
              <View key={d} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: theme.textPrimary }}>{d}</Text>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>{n}</Text>
              </View>
            ))}
          </View>
        </Glass>

        <Glass style={{ padding: 14, marginTop: 12 }}>
          <Cap style={{ marginBottom: 12 }}>Your daily targets</Cap>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Metric value="2,224" label="calories · fat-loss" theme={theme} />
            <Metric value="2,780" label="TDEE burn" theme={theme} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            {MACROS.map(([v, l]) => (
              <View
                key={l}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  backgroundColor: theme.fillSoft,
                  borderRadius: 12,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textPrimary }}>{v}</Text>
                <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{l}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>Complete your profile for finer targets</Text>
            <Text style={{ fontSize: 12, fontWeight: '500', color: theme.greenText }}>Later ›</Text>
          </View>
        </Glass>
      </ScrollView>
      <View style={{ paddingTop: 12 }}>
        <PrimaryButton label="Start training" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}

function Metric({ value, label, theme }: { value: string; label: string; theme: any }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', letterSpacing: -0.4, color: theme.textPrimary }}>{value}</Text>
      <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{label}</Text>
    </View>
  );
}
