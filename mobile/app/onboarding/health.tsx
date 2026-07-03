import { useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Glass, Cap, Segmented, PrimaryButton } from '@/components/ui';
import { StepHeader, Chip } from '@/components/onboarding';
import { useTheme } from '@/theme/ThemeProvider';

const PARQ = [
  'Heart condition diagnosed by a doctor',
  'Chest pain during activity',
  'On blood-pressure / heart medication',
];
const INJURIES = ['Shoulder', 'Lower back', 'Knee', 'Wrist', 'Elbow', 'Hip', 'None'];

export default function Health() {
  const router = useRouter();
  const { theme } = useTheme();
  const [answers, setAnswers] = useState<Record<number, 'yes' | 'no'>>({ 0: 'no', 1: 'no', 2: 'no' });
  const [injuries, setInjuries] = useState<string[]>(['Shoulder']);

  const toggleInjury = (name: string) => {
    if (name === 'None') return setInjuries(['None']);
    setInjuries((prev) => {
      const next = prev.filter((x) => x !== 'None');
      return next.includes(name) ? next.filter((x) => x !== name) : [...next, name];
    });
  };

  return (
    <Screen ambient="red">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <StepHeader
          step={7}
          total={7}
          title={'Health &\nreadiness'}
          sub="Quick safety check — keeps your plan appropriate for you."
        />

        <Cap style={{ marginBottom: 10 }}>Any of these apply?</Cap>
        <Glass style={{ paddingHorizontal: 14 }}>
          {PARQ.map((q, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 13,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: theme.hairline,
              }}
            >
              <Text style={{ flex: 1, fontSize: 13, color: theme.textPrimary }}>{q}</Text>
              <Segmented
                value={answers[i]}
                onChange={(v) => setAnswers((a) => ({ ...a, [i]: v }))}
                options={[
                  { label: 'Yes', value: 'yes' },
                  { label: 'No', value: 'no' },
                ]}
                style={{ width: 120 }}
              />
            </View>
          ))}
        </Glass>

        <Cap style={{ marginTop: 22, marginBottom: 10 }}>Any injuries to work around?</Cap>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {INJURIES.map((name) => (
            <Chip key={name} label={name} selected={injuries.includes(name)} onPress={() => toggleInjury(name)} />
          ))}
        </View>

        <Glass style={{ flexDirection: 'row', gap: 10, padding: 12, marginTop: 18, alignItems: 'flex-start' }}>
          <MaterialCommunityIcons name="shield-check-outline" size={18} color={theme.green} />
          <Text style={{ fontSize: 11, color: theme.textMuted, flex: 1, lineHeight: 16 }}>
            General fitness guidance, not medical advice. If any answer is "yes," check with a physician before
            starting. Selected injuries are excluded from your plan.
          </Text>
        </Glass>
      </ScrollView>
      <View style={{ paddingTop: 12 }}>
        <PrimaryButton label="See my plan" onPress={() => router.push('/onboarding/ready')} />
      </View>
    </Screen>
  );
}
