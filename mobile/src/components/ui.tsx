import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

/** Screen wrapper: canvas background + soft ambient glow behind content. */
export function Screen({
  children,
  ambient = 'default',
  scroll,
  contentStyle,
}: {
  children: React.ReactNode;
  ambient?: 'default' | 'red' | 'green' | 'none';
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.canvas }}>
      {ambient !== 'none' && (
        <>
          {(ambient === 'default' || ambient === 'red') && (
            <View
              pointerEvents="none"
              style={[styles.blob, { backgroundColor: theme.red, top: -40, right: -50 }]}
            />
          )}
          {(ambient === 'default' || ambient === 'green') && (
            <View
              pointerEvents="none"
              style={[styles.blob, { backgroundColor: theme.green, bottom: 40, left: -60 }]}
            />
          )}
        </>
      )}
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={[{ flex: 1, paddingHorizontal: 20, paddingVertical: 8 }, contentStyle]}>
          {children}
        </View>
      </SafeAreaView>
    </View>
  );
}

/** Frosted liquid-glass surface. Pass padding via `style`. */
export function Glass({
  children,
  style,
  r = radius.card,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  r?: number;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        { borderRadius: r, overflow: 'hidden', borderWidth: 1, borderColor: theme.glassBorder },
        style,
      ]}
    >
      <BlurView
        intensity={theme.blurIntensity}
        tint={theme.blurTint}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.glassBg }]} />
      {children}
    </View>
  );
}

export function Title({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const { theme } = useTheme();
  return (
    <Text style={[{ fontSize: 22, fontWeight: '700', letterSpacing: -0.4, color: theme.textPrimary }, style]}>
      {children}
    </Text>
  );
}

export function Sub({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return <Text style={{ fontSize: 13, lineHeight: 19, color: theme.textSecondary, marginTop: 8 }}>{children}</Text>;
}

export function Cap({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const { theme } = useTheme();
  return (
    <Text style={[{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: theme.textMuted }, style]}>
      {children}
    </Text>
  );
}

export function PrimaryButton({ label, onPress }: { label: string; onPress?: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: theme.ink,
          borderRadius: 15,
          paddingVertical: 15,
          alignItems: 'center',
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <Text style={{ color: theme.onInk, fontSize: 15, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({ label, onPress }: { label: string; onPress?: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ paddingVertical: 12, alignItems: 'center' }}>
      <Text style={{ color: theme.textSecondary, fontSize: 14, fontWeight: '500' }}>{label}</Text>
    </Pressable>
  );
}

export function ProgressBar({ step, total }: { step: number; total: number }) {
  const { theme } = useTheme();
  return (
    <View style={{ height: 5, borderRadius: 20, backgroundColor: theme.track, overflow: 'hidden' }}>
      <View style={{ width: `${(step / total) * 100}%`, height: '100%', backgroundColor: theme.ink }} />
    </View>
  );
}

/** A labelled row on a soft field surface (e.g. onboarding stats). */
export function Field({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14,
        backgroundColor: theme.fieldBg,
        borderWidth: 1,
        borderColor: theme.glassBorder,
      }}
    >
      <Text style={{ fontSize: 14, color: theme.textSecondary }}>{label}</Text>
      <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textPrimary }}>{value}</Text>
    </View>
  );
}

/** Single-select segmented control. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: theme.fieldBg,
          borderWidth: 1,
          borderColor: theme.glassBorder,
          borderRadius: 12,
          padding: 3,
          gap: 2,
        },
        style,
      ]}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 7,
              borderRadius: 9,
              backgroundColor: on ? theme.ink : 'transparent',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: on ? '500' : '400', color: on ? theme.onInk : theme.textSecondary }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.12,
  },
});
