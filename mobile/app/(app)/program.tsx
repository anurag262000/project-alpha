import { ScrollView, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Glass, Cap } from '@/components/ui';
import { BottomNav } from '@/components/BottomNav';
import { useTheme } from '@/theme/ThemeProvider';

export default function Program() {
  const router = useRouter();
  const { theme } = useTheme();

  const Day = ({
    icon,
    color,
    title,
    sub,
    right,
    faded,
  }: {
    icon: any;
    color: string;
    title: string;
    sub: string;
    right: string;
    faded?: boolean;
  }) => (
    <Glass style={{ padding: 14, opacity: faded ? 0.7 : 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <MaterialCommunityIcons name={icon} size={20} color={color} />
          <View>
            <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textPrimary }}>{title}</Text>
            <Text style={{ fontSize: 12, color: theme.textMuted }}>{sub}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 12, color: theme.textMuted }}>{right}</Text>
      </View>
    </Glass>
  );

  return (
    <Screen ambient="default" bottomNav={<BottomNav active="program" />}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Cap>Active program</Cap>
            <Text style={{ fontSize: 20, fontWeight: '700', letterSpacing: -0.4, color: theme.textPrimary }}>Upper / Lower</Text>
          </View>
          <Glass style={{ paddingVertical: 7, paddingHorizontal: 13 }} r={20}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: theme.textPrimary }}>Week 3</Text>
          </Glass>
        </View>

        <Glass style={{ padding: 14, marginTop: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Cap>This week</Cap>
            <Text style={{ fontSize: 12, color: theme.greenText }}>2 of 4 done</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
            {[theme.green, theme.green, theme.ink, theme.track].map((c, i) => (
              <View key={i} style={{ width: 22, height: 6, borderRadius: 20, backgroundColor: c }} />
            ))}
          </View>
        </Glass>

        <View style={{ gap: 12, marginTop: 16 }}>
          <Day icon="check-circle" color={theme.green} title="Upper A" sub="Chest · back · shoulders" right="Mon" faded />
          <Day icon="check-circle" color={theme.green} title="Lower A" sub="Quads · hamstrings · glutes" right="Wed" faded />
          <Pressable onPress={() => router.push('/logging')}>
            <View style={{ borderRadius: 18, padding: 14, backgroundColor: theme.ink }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <MaterialCommunityIcons name="play" size={20} color={theme.onInk} />
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: theme.onInk }}>Upper B · today</Text>
                    <Text style={{ fontSize: 12, color: theme.onInk, opacity: 0.6 }}>Bench · row · OHP · +3</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.onInk} />
              </View>
            </View>
          </Pressable>
          <Day icon="circle-outline" color={theme.textDisabled} title="Lower B" sub="Deadlift · lunge · calves" right="Sat" />
        </View>
      </ScrollView>
    </Screen>
  );
}
