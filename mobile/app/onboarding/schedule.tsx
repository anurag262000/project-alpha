import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Cap, Segmented, PrimaryButton } from '@/components/ui';
import { StepHeader, DayPicker } from '@/components/onboarding';

export default function Schedule() {
  const router = useRouter();
  const [days, setDays] = useState<number[]>([1, 3, 5, 6]);
  const [time, setTime] = useState<'morning' | 'midday' | 'evening' | 'flexible'>('evening');
  const [length, setLength] = useState('60');

  const toggle = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  return (
    <Screen ambient="red">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <StepHeader step={5} total={7} title="Your week" sub="Which days can you train, when, and for how long?" />

        <Cap style={{ marginBottom: 12 }}>{`Training days · ${days.length} selected`}</Cap>
        <DayPicker value={days} onToggle={toggle} />

        <Cap style={{ marginTop: 26, marginBottom: 12 }}>Preferred time</Cap>
        <Segmented
          value={time}
          onChange={setTime}
          options={[
            { label: 'Morning', value: 'morning' },
            { label: 'Midday', value: 'midday' },
            { label: 'Evening', value: 'evening' },
            { label: 'Flexible', value: 'flexible' },
          ]}
        />

        <Cap style={{ marginTop: 26, marginBottom: 12 }}>Session length</Cap>
        <Segmented
          value={length}
          onChange={setLength}
          options={[
            { label: '30', value: '30' },
            { label: '45', value: '45' },
            { label: '60', value: '60' },
            { label: '75', value: '75' },
            { label: '90', value: '90' },
          ]}
        />
      </ScrollView>
      <View style={{ paddingTop: 12 }}>
        <PrimaryButton label="Continue" onPress={() => router.push('/onboarding/equipment')} />
      </View>
    </Screen>
  );
}
