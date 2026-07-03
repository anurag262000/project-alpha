import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Glass, Cap } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';

const COLS = [
  { label: 'KG', rows: ['57.5', '60', '62.5', '65', '67.5'] },
  { label: 'REPS', rows: ['6', '7', '8', '9', '10'] },
  { label: 'RPE', rows: ['7', '7.5', '8', '8.5', '9'] },
];

export default function Logging() {
  const router = useRouter();
  const { theme } = useTheme();

  const Wheel = ({ label, rows, bordered }: { label: string; rows: string[]; bordered?: boolean }) => (
    <View
      style={{
        flex: 1,
        borderLeftWidth: bordered ? 1 : 0,
        borderRightWidth: bordered ? 1 : 0,
        borderColor: theme.hairline,
      }}
    >
      <Cap style={{ textAlign: 'center', paddingBottom: 4 }}>{label}</Cap>
      {rows.map((r, i) => {
        const selected = i === 2;
        const faded = i === 0 || i === 4;
        return (
          <Text
            key={i}
            style={{
              textAlign: 'center',
              paddingVertical: 6,
              fontSize: selected ? 26 : 15,
              fontWeight: selected ? '700' : '400',
              color: selected ? theme.onInk : faded ? theme.textDisabled : theme.textMuted,
            }}
          >
            {r}
          </Text>
        );
      })}
    </View>
  );

  return (
    <Screen ambient="red">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable onPress={() => router.push('/home')}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={theme.textMuted} />
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textPrimary }}>Bench press</Text>
          <Cap>set 3 of 4</Cap>
        </View>
        <MaterialCommunityIcons name="dots-horizontal" size={26} color={theme.textMuted} />
      </View>

      <Text style={{ textAlign: 'center', fontSize: 12, color: theme.textMuted, marginTop: 16, marginBottom: 6 }}>
        last time · <Text style={{ color: theme.redText }}>60 kg × 8 @ 8</Text>
      </Text>

      <Glass style={{ paddingVertical: 8, paddingHorizontal: 6 }}>
        <View
          style={{
            position: 'absolute',
            left: 8,
            right: 8,
            top: '50%',
            marginTop: -26,
            height: 52,
            borderRadius: 13,
            backgroundColor: theme.ink,
          }}
        />
        <View style={{ flexDirection: 'row' }}>
          {COLS.map((c, i) => (
            <Wheel key={c.label} label={c.label} rows={c.rows} bordered={i === 1} />
          ))}
        </View>
      </Glass>

      <Text style={{ textAlign: 'center', fontSize: 11, color: theme.textMuted, marginTop: 8 }}>
        ↕ scroll to dial · no keyboard
      </Text>

      <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 16 }}>
        {[theme.green, theme.green, theme.ink, theme.track].map((c, i) => (
          <View key={i} style={{ width: 22, height: 6, borderRadius: 20, backgroundColor: c }} />
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 18, alignItems: 'center' }}>
        <Glass style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 13, paddingHorizontal: 14 }}>
          <MaterialCommunityIcons name="clock-outline" size={18} color={theme.green} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textPrimary }}>1:30</Text>
        </Glass>
        <Pressable
          onPress={() => router.push('/summary')}
          style={{
            flex: 1,
            backgroundColor: theme.green,
            borderRadius: 15,
            paddingVertical: 15,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <MaterialCommunityIcons name="check" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Log set</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
