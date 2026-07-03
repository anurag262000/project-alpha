import { useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Glass, PrimaryButton } from '@/components/ui';
import { StepHeader, OptionCard } from '@/components/onboarding';
import { useTheme } from '@/theme/ThemeProvider';

const OPTIONS = [
  { icon: 'sofa-single', title: 'Mostly sedentary', sub: 'Desk job, little walking' },
  { icon: 'walk', title: 'Lightly active', sub: 'Some walking through the day' },
  { icon: 'run', title: 'Moderately active', sub: 'On your feet a good part of the day' },
  { icon: 'briefcase-variant', title: 'Very active', sub: 'Physical or manual job' },
] as const;

export default function Activity() {
  const router = useRouter();
  const { theme } = useTheme();
  const [selected, setSelected] = useState(2);

  return (
    <Screen ambient="green">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <StepHeader
          step={2}
          total={7}
          title="How active is your day?"
          sub="Life outside training — this sets your daily calorie needs."
        />
        <View style={{ gap: 12 }}>
          {OPTIONS.map((o, i) => (
            <OptionCard
              key={o.title}
              icon={o.icon}
              title={o.title}
              sub={o.sub}
              selected={selected === i}
              onPress={() => setSelected(i)}
            />
          ))}
        </View>
        <Glass style={{ flexDirection: 'row', gap: 10, padding: 12, marginTop: 16, alignItems: 'center' }}>
          <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color={theme.green} />
          <Text style={{ fontSize: 12, color: theme.textSecondary, flex: 1 }}>
            Combined with your training days, this sets your TDEE — the calories you burn in a day.
          </Text>
        </Glass>
      </ScrollView>
      <View style={{ paddingTop: 12 }}>
        <PrimaryButton label="Continue" onPress={() => router.push('/onboarding/goal')} />
      </View>
    </Screen>
  );
}
