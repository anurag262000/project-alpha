import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, PrimaryButton } from '@/components/ui';
import { StepHeader, OptionCard } from '@/components/onboarding';

const OPTIONS = [
  { icon: 'sprout', title: 'New to lifting', sub: 'Just getting started' },
  { icon: 'fire', title: 'Under 1 year', sub: 'Building the habit' },
  { icon: 'trending-up', title: '1–3 years', sub: 'Consistent and progressing' },
  { icon: 'medal-outline', title: '3+ years', sub: 'Advanced trainer' },
] as const;

export default function Experience() {
  const router = useRouter();
  const [selected, setSelected] = useState(2);

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
        <PrimaryButton label="Continue" onPress={() => router.push('/onboarding/schedule')} />
      </View>
    </Screen>
  );
}
