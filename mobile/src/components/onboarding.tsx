import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { Cap, Glass, ProgressBar, Title, Sub } from './ui';

/** Cap + progress + title + subtitle block at the top of an onboarding step. */
export function StepHeader({
  step,
  total,
  title,
  sub,
}: {
  step: number;
  total: number;
  title: string;
  sub?: string;
}) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Cap>{`Step ${step} of ${total}`}</Cap>
      <View style={{ marginTop: 10, marginBottom: 18 }}>
        <ProgressBar step={step} total={total} />
      </View>
      <Title>{title}</Title>
      {sub ? <Sub>{sub}</Sub> : null}
    </View>
  );
}

/** Selectable option row: glass when idle, ink when selected. */
export function OptionCard({
  icon,
  title,
  sub,
  selected,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  sub: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selected ? 'rgba(251,44,54,0.2)' : theme.fillSoft,
        }}
      >
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={selected ? theme.red : theme.textSecondary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: selected ? theme.onInk : theme.textPrimary }}>
          {title}
        </Text>
        <Text style={{ fontSize: 12, color: selected ? withAlpha(theme.onInk, 0.65) : theme.textMuted, marginTop: 2 }}>
          {sub}
        </Text>
      </View>
      {selected && <MaterialCommunityIcons name="check-circle" size={22} color={theme.onInk} />}
    </View>
  );

  return (
    <Pressable onPress={onPress}>
      {selected ? (
        <View style={{ backgroundColor: theme.ink, borderRadius: 17 }}>{content}</View>
      ) : (
        <Glass r={17}>{content}</Glass>
      )}
    </Pressable>
  );
}

/** Small selectable pill (injuries, filters). */
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 7,
        paddingHorizontal: 13,
        borderRadius: 20,
        backgroundColor: selected ? theme.ink : theme.fieldBg,
        borderWidth: 1,
        borderColor: selected ? theme.ink : theme.glassBorder,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: '500', color: selected ? theme.onInk : theme.textSecondary }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Weekly day picker (S M T W T F S). value is a set of 0..6 (Sun..Sat). */
export function DayPicker({
  value,
  onToggle,
}: {
  value: number[];
  onToggle: (day: number) => void;
}) {
  const { theme } = useTheme();
  const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {labels.map((l, i) => {
        const on = value.includes(i);
        return (
          <Pressable
            key={i}
            onPress={() => onToggle(i)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? theme.ink : theme.fieldBg,
              borderWidth: 1,
              borderColor: on ? theme.ink : theme.glassBorder,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '500', color: on ? theme.onInk : theme.textSecondary }}>
              {l}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function withAlpha(hex: string, a: number): string {
  // hex like #RRGGBB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}
