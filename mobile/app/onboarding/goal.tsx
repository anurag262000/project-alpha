import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, PrimaryButton } from '@/components/ui';
import { StepHeader, OptionCard } from '@/components/onboarding';

const OPTIONS = [
  { icon: 'fire', title: 'Fat loss', sub: 'Lean out, keep strength' },
  { icon: 'dumbbell', title: 'Muscle gain', sub: 'Build size and mass' },
  { icon: 'sync', title: 'Recomp', sub: 'Lose fat, gain muscle' },
  { icon: 'heart-outline', title: 'General fitness', sub: 'Stay healthy and active' },
] as const;

export default function Goal() {
  const router = useRouter();
  const [selected, setSelected] = useState(0);

  return (
    <Screen ambient="default">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <StepHeader
          step={3}
          total={7}
          title={'What’s your\nmain goal?'}
          sub="This shapes your rep ranges and weekly volume."
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
        <PrimaryButton label="Continue" onPress={() => router.push('/onboarding/experience')} />
      </View>
    </Screen>
  );
}
