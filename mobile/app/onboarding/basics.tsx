import { useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Glass, Cap, Field, Segmented, PrimaryButton } from '@/components/ui';
import { StepHeader } from '@/components/onboarding';
import { useTheme } from '@/theme/ThemeProvider';

export default function Basics() {
  const router = useRouter();
  const { theme } = useTheme();
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [accuracy, setAccuracy] = useState<'estimated' | 'measured'>('estimated');

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
          <Field label="Date of birth" value="12 Jun 1998" />
          <Field label="Height" value="178 cm" />
          <View style={[fieldRow(theme), { flexDirection: 'column', alignItems: 'stretch', gap: 10 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, color: theme.textSecondary }}>Weight</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textPrimary }}>81.6 kg</Text>
            </View>
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

        <Glass style={{ marginTop: 14, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Cap>Body mass index · auto</Cap>
            <View
              style={{
                paddingVertical: 4,
                paddingHorizontal: 10,
                borderRadius: 20,
                backgroundColor: 'rgba(251,44,54,0.14)',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: theme.redText }}>Overweight</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            <Text style={{ fontSize: 26, fontWeight: '700', letterSpacing: -0.4, color: theme.textPrimary }}>25.8</Text>
            <Text style={{ fontSize: 12, color: theme.textMuted }}>kg/m² · recalculates as your weight changes</Text>
          </View>
        </Glass>
      </ScrollView>

      <View style={{ paddingTop: 12 }}>
        <PrimaryButton label="Continue" onPress={() => router.push('/onboarding/activity')} />
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
