import { useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Glass, Cap, Segmented, PrimaryButton } from '@/components/ui';
import { DateField, HeightField, WeightField, fromIsoDate } from '@/components/pickers';
import { StepHeader } from '@/components/onboarding';
import { useTheme } from '@/theme/ThemeProvider';
import { useOnboarding } from '@/store/onboarding';
import { computeBMI, bmiCategory } from '@/lib/health';

export default function Basics() {
  const router = useRouter();
  const { theme } = useTheme();
  const draft = useOnboarding((s) => s.draft);
  const setDraft = useOnboarding((s) => s.set);

  const [sex, setSex] = useState<'male' | 'female'>(draft.sex ?? 'male');
  const [dob, setDob] = useState(draft.dateOfBirth ?? '');
  const [heightCm, setHeightCm] = useState<number | null>(draft.heightCm ?? null);
  const [weightKg, setWeightKg] = useState(draft.weightKg ?? 70);
  const [accuracy, setAccuracy] = useState<'estimated' | 'measured'>(draft.weightAccuracy ?? 'estimated');
  const [error, setError] = useState<string | null>(null);

  const bmi = heightCm && heightCm > 0 ? computeBMI(weightKg, heightCm) : null;
  const normal = bmi !== null && bmiCategory(bmi) === 'normal';

  const submit = () => {
    setError(null);
    const dobDate = fromIsoDate(dob);
    if (!dobDate || dobDate > new Date()) return setError('Pick your date of birth.');
    if (!(heightCm !== null && heightCm >= 100 && heightCm <= 250))
      return setError('Enter a height between 100 and 250 cm.');
    setDraft({ sex, dateOfBirth: dob, heightCm, weightKg, weightAccuracy: accuracy });
    router.push('/onboarding/activity');
  };

  return (
    <Screen ambient="green">
      <View style={{ flex: 1 }}>
        <StepHeader step={1} total={7} title="About you" sub="The baseline your progress is measured against." />

        <View style={{ gap: 14 }}>
          <View style={fieldRow(theme)}>
            <Text style={{ fontSize: 14, color: theme.textSecondary }}>Sex</Text>
            <Segmented
              compact
              value={sex}
              onChange={setSex}
              options={[
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
              ]}
              style={{ width: 156 }}
            />
          </View>

          <DateField
            value={dob}
            onChange={setDob}
            error={error?.startsWith('Pick') ? error : undefined}
          />

          <HeightField
            valueCm={heightCm}
            onChange={setHeightCm}
            error={error?.startsWith('Enter a height') ? error : undefined}
          />

          <WeightField valueKg={weightKg} onChange={setWeightKg} />

          <View style={fieldRow(theme)}>
            <Text style={{ fontSize: 14, color: theme.textSecondary }}>Weight is</Text>
            <Segmented
              compact
              value={accuracy}
              onChange={setAccuracy}
              options={[
                { label: 'Estimated', value: 'estimated' },
                { label: 'Measured', value: 'measured' },
              ]}
              style={{ width: 186 }}
            />
          </View>
        </View>

        {bmi !== null && (
          <Glass style={{ marginTop: 14, paddingVertical: 12, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Cap>Body mass index · auto</Cap>
                <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 3 }}>
                  Recalculates as your weight changes
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                <Text style={{ fontSize: 24, fontWeight: '700', letterSpacing: -0.4, color: theme.textPrimary }}>
                  {bmi.toFixed(1)}
                </Text>
                <View
                  style={{
                    paddingVertical: 3,
                    paddingHorizontal: 9,
                    borderRadius: 20,
                    backgroundColor: normal ? 'rgba(16,185,129,0.14)' : 'rgba(251,44,54,0.14)',
                  }}
                >
                  <Text
                    style={{ fontSize: 11, fontWeight: '600', color: normal ? theme.greenText : theme.redText }}
                  >
                    {bmiCategory(bmi)}
                  </Text>
                </View>
              </View>
            </View>
          </Glass>
        )}
      </View>

      <View style={{ paddingTop: 12 }}>
        <PrimaryButton label="Continue" onPress={submit} />
      </View>
    </Screen>
  );
}

const fieldRow = (theme: any) => ({
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
  minHeight: 46,
  paddingVertical: 5,
  paddingHorizontal: 14,
  borderRadius: 14,
  backgroundColor: theme.fieldBg,
  borderWidth: 1,
  borderColor: theme.glassBorder,
});
