import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, PrimaryButton } from '@/components/ui';
import { StepHeader, OptionCard } from '@/components/onboarding';

const OPTIONS = [
  { icon: 'home-outline', title: 'Home · minimal', sub: 'Bodyweight and bands' },
  { icon: 'home-city-outline', title: 'Home · full', sub: 'Dumbbells and a bench' },
  { icon: 'weight-lifter', title: 'Full gym', sub: 'Barbells, machines, cables' },
] as const;

export default function Equipment() {
  const router = useRouter();
  const [selected, setSelected] = useState(2);

  return (
    <Screen ambient="green">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <StepHeader
          step={6}
          total={7}
          title={'What can you\ntrain with?'}
          sub="We only pick exercises you can actually do."
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
        <PrimaryButton label="Continue" onPress={() => router.push('/onboarding/health')} />
      </View>
    </Screen>
  );
}
