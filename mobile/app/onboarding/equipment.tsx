import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, PrimaryButton } from '@/components/ui';
import { StepHeader, OptionCard } from '@/components/onboarding';
import { useOnboarding, type Equipment as EquipmentType } from '@/store/onboarding';

const OPTIONS = [
  { icon: 'home-outline', title: 'Home · minimal', sub: 'Bodyweight and bands', value: 'home_minimal' },
  { icon: 'home-city-outline', title: 'Home · full', sub: 'Dumbbells and a bench', value: 'home_full' },
  { icon: 'weight-lifter', title: 'Full gym', sub: 'Barbells, machines, cables', value: 'gym' },
] as const;

export default function Equipment() {
  const router = useRouter();
  const draft = useOnboarding((s) => s.draft);
  const setDraft = useOnboarding((s) => s.set);
  const [selected, setSelected] = useState(() =>
    Math.max(0, OPTIONS.findIndex((o) => o.value === (draft.equipmentAccess ?? 'gym')))
  );

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
        <PrimaryButton
          label="Continue"
          onPress={() => {
            setDraft({ equipmentAccess: OPTIONS[selected].value as EquipmentType });
            router.push('/onboarding/health');
          }}
        />
      </View>
    </Screen>
  );
}
