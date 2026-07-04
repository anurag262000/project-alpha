import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, PrimaryButton } from '@/components/ui';
import { StepHeader, OptionCard } from '@/components/onboarding';
import { useOnboarding } from '@/store/onboarding';
import type { Goal as GoalType } from '@/lib/health';

const OPTIONS = [
  { icon: 'fire', title: 'Fat loss', sub: 'Lean out, keep strength', value: 'fat_loss' },
  { icon: 'dumbbell', title: 'Muscle gain', sub: 'Build size and mass', value: 'muscle_gain' },
  { icon: 'sync', title: 'Recomp', sub: 'Lose fat, gain muscle', value: 'recomp' },
  { icon: 'heart-outline', title: 'General fitness', sub: 'Stay healthy and active', value: 'general_fitness' },
] as const;

export default function Goal() {
  const router = useRouter();
  const draft = useOnboarding((s) => s.draft);
  const setDraft = useOnboarding((s) => s.set);
  const [selected, setSelected] = useState(() =>
    Math.max(0, OPTIONS.findIndex((o) => o.value === (draft.goal ?? 'fat_loss')))
  );

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
        <PrimaryButton
          label="Continue"
          onPress={() => {
            setDraft({ goal: OPTIONS[selected].value as GoalType });
            router.push('/onboarding/experience');
          }}
        />
      </View>
    </Screen>
  );
}
