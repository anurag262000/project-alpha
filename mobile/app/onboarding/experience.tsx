import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, PrimaryButton } from '@/components/ui';
import { StepHeader, OptionCard } from '@/components/onboarding';
import { useOnboarding, type Experience as ExperienceType } from '@/store/onboarding';

const OPTIONS = [
  { icon: 'sprout', title: 'New to lifting', sub: 'Just getting started', value: 'new' },
  { icon: 'fire', title: 'Under 1 year', sub: 'Building the habit', value: 'under_1yr' },
  { icon: 'trending-up', title: '1–3 years', sub: 'Consistent and progressing', value: '1_3yr' },
  { icon: 'medal-outline', title: '3+ years', sub: 'Advanced trainer', value: '3yr_plus' },
] as const;

export default function Experience() {
  const router = useRouter();
  const draft = useOnboarding((s) => s.draft);
  const setDraft = useOnboarding((s) => s.set);
  const [selected, setSelected] = useState(() =>
    Math.max(0, OPTIONS.findIndex((o) => o.value === (draft.experienceLevel ?? '1_3yr')))
  );

  return (
    <Screen ambient="green">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <StepHeader
          step={4}
          total={7}
          title={'How long have\nyou trained?'}
          sub="Sets your starting volume and which splits fit."
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
      </ScrollView>
      <View style={{ paddingTop: 12 }}>
        <PrimaryButton
          label="Continue"
          onPress={() => {
            setDraft({ experienceLevel: OPTIONS[selected].value as ExperienceType });
            router.push('/onboarding/schedule');
          }}
        />
      </View>
    </Screen>
  );
}
