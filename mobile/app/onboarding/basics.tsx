import { useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Glass, Cap, Segmented, PrimaryButton, TextField } from '@/components/ui';
import { StepHeader } from '@/components/onboarding';
import { useTheme } from '@/theme/ThemeProvider';
import { useOnboarding } from '@/store/onboarding';
import { computeBMI, bmiCategory } from '@/lib/health';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default function Basics() {
  const router = useRouter();
  const { theme } = useTheme();
  const draft = useOnboarding((s) => s.draft);
  const setDraft = useOnboarding((s) => s.set);

  const [sex, setSex] = useState<'male' | 'female'>(draft.sex ?? 'male');
  const [dob, setDob] = useState(draft.dateOfBirth ?? '');
  const [height, setHeight] = useState(draft.heightCm ? String(draft.heightCm) : '');
  const [weight, setWeight] = useState(draft.weightKg ? String(draft.weightKg) : '');
  const [accuracy, setAccuracy] = useState<'estimated' | 'measured'>(draft.weightAccuracy ?? 'estimated');
  const [error, setError] = useState<string | null>(null);

  const heightNum = parseFloat(height);
  const weightNum = parseFloat(weight);
  const bmi = heightNum > 0 && weightNum > 0 ? computeBMI(weightNum, heightNum) : null;

  const submit = () => {
    setError(null);
    if (!ISO_DATE.test(dob)) return setError('Enter your date of birth as YYYY-MM-DD.');
    const dobDate = new Date(dob);
    if (Number.isNaN(dobDate.getTime()) || dobDate > new Date()) return setError('Enter a valid date of birth.');
    if (!(heightNum >= 100 && heightNum <= 250)) return setError('Enter a height between 100 and 250 cm.');
    if (!(weightNum >= 30 && weightNum <= 300)) return setError('Enter a weight between 30 and 300 kg.');
    setDraft({ sex, dateOfBirth: dob, heightCm: heightNum, weightKg: weightNum, weightAccuracy: accuracy });
    router.push('/onboarding/activity');
  };

  return (
    <Screen ambient="green">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <StepHeader step={1} total={7} title="About you" sub="The baseline your progress is measured against." />

        <View style={{ gap: 12 }}>
          <View style={fieldRow(theme)}>
            <Text style={{ fontSize: 14, color: theme.textSecondary }}>Sex</Text>
            <Segmented
              value={sex}
              onChange={setSex}
              options={[
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
              ]}
              style={{ width: 180 }}
            />
          </View>
          <TextField
            label="Date of birth"
            value={dob}
            onChangeText={setDob}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
          />
          <TextField
            label="Height (cm)"
            value={height}
            onChangeText={setHeight}
            placeholder="e.g. 178"
            keyboardType="numeric"
          />
          <TextField
            label="Weight (kg)"
            value={weight}
            onChangeText={setWeight}
            placeholder="e.g. 81.6"
            keyboardType="numeric"
            error={error ?? undefined}
          />
          <View style={[fieldRow(theme), { flexDirection: 'column', alignItems: 'stretch', gap: 10 }]}>
            <Text style={{ fontSize: 14, color: theme.textSecondary }}>How sure is that weight?</Text>
            <Segmented
              value={accuracy}
              onChange={setAccuracy}
              options={[
                { label: 'Estimated', value: 'estimated' },
                { label: 'Measured', value: 'measured' },
              ]}
            />
          </View>
        </View>

        {bmi !== null && (
          <Glass style={{ marginTop: 14, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Cap>Body mass index · auto</Cap>
              <View
                style={{
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                  borderRadius: 20,
                  backgroundColor:
                    bmiCategory(bmi) === 'normal' ? 'rgba(16,185,129,0.14)' : 'rgba(251,44,54,0.14)',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: bmiCategory(bmi) === 'normal' ? theme.greenText : theme.redText,
                  }}
                >
                  {bmiCategory(bmi)}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
              <Text style={{ fontSize: 26, fontWeight: '700', letterSpacing: -0.4, color: theme.textPrimary }}>
                {bmi.toFixed(1)}
              </Text>
              <Text style={{ fontSize: 12, color: theme.textMuted }}>kg/m² · recalculates as your weight changes</Text>
            </View>
          </Glass>
        )}
      </ScrollView>

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
  paddingVertical: 14,
  paddingHorizontal: 16,
  borderRadius: 14,
  backgroundColor: theme.fieldBg,
  borderWidth: 1,
  borderColor: theme.glassBorder,
});
