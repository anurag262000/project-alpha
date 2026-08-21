import React from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
  type TextStyle,
  type TextInputProps,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

/** Screen wrapper: canvas background + soft ambient glow behind content. */
export function Screen({
  children,
  ambient = 'default',
  contentStyle,
  bottomNav,
}: {
  children: React.ReactNode;
  ambient?: 'default' | 'red' | 'green' | 'none';
  contentStyle?: StyleProp<ViewStyle>;
  bottomNav?: React.ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.canvas }}>
      {ambient !== 'none' && (
        <>
          {(ambient === 'default' || ambient === 'red') && (
            <Glow color={theme.red} style={{ top: -160, right: -170 }} />
          )}
          {(ambient === 'default' || ambient === 'green') && (
            <Glow color={theme.green} style={{ bottom: -80, left: -180 }} />
          )}
        </>
      )}
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={[{ flex: 1, paddingHorizontal: 20, paddingVertical: 8 }, contentStyle]}>
          {children}
        </View>
      </SafeAreaView>
      {bottomNav}
    </View>
  );
}

/**
 * Soft ambient glow. React Native has no `filter: blur()`, so the prototype's
 * blurred circle is drawn as a radial gradient that fades to transparent —
 * same look, no offscreen blur pass.
 */
export function Glow({
  color,
  size = 460,
  style,
}: {
  color: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  // Gradient ids are global to the SVG renderer, so keep them unique per
  // instance — and strip useId's colons, which aren't valid in a fragment ref.
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={color} stopOpacity={theme.glowOpacity} />
            <Stop offset="0.45" stopColor={color} stopOpacity={theme.glowOpacity * 0.5} />
            <Stop offset="0.75" stopColor={color} stopOpacity={theme.glowOpacity * 0.14} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={size} height={size} fill={`url(#${id})`} />
      </Svg>
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

/** Labelled text input on the same soft field surface as `Field`. */
export function TextField({
  label,
  error,
  style,
  ...props
}: {
  label: string;
  error?: string;
  style?: StyleProp<ViewStyle>;
} & TextInputProps) {
  const { theme } = useTheme();
  return (
    <View style={style}>
      <Cap style={{ marginBottom: 8, marginLeft: 4 }}>{label}</Cap>
      <TextInput
        placeholderTextColor={theme.textMuted}
        {...props}
        style={{
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 14,
          backgroundColor: theme.fieldBg,
          borderWidth: 1,
          borderColor: error ? theme.red : theme.glassBorder,
          fontSize: 15,
          color: theme.textPrimary,
        }}
      />
      {error ? (
        <Text style={{ fontSize: 12, color: theme.redText, marginTop: 6, marginLeft: 4 }}>{error}</Text>
      ) : null}
    </View>
  );
}

/**
 * Uppercase label above a soft field surface. Pass `onPress` when the field
 * opens a picker rather than taking keyboard input.
 */
export function LabeledField({
  label,
  children,
  onPress,
  error,
}: {
  label: string;
  children: React.ReactNode;
  onPress?: () => void;
  error?: string;
}) {
  const { theme } = useTheme();
  const surface = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 50,
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: theme.fieldBg,
        borderWidth: 1,
        borderColor: error ? theme.red : theme.glassBorder,
        gap: 10,
      }}
    >
      {children}
    </View>
  );
  return (
    <View>
      <Cap style={{ marginBottom: 8, marginLeft: 4 }}>{label}</Cap>
      {onPress ? <Pressable onPress={onPress}>{surface}</Pressable> : surface}
      {error ? (
        <Text style={{ fontSize: 12, color: theme.redText, marginTop: 6, marginLeft: 4 }}>{error}</Text>
      ) : null}
    </View>
  );
}

/** Single-select segmented control. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
  compact = false,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
  /** Tighter track for sitting inline inside a `Row`. */
  compact?: boolean;
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
          borderRadius: compact ? 10 : 12,
          padding: compact ? 2 : 3,
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
              paddingVertical: compact ? 5 : 7,
              paddingHorizontal: compact ? 8 : 0,
              borderRadius: compact ? 8 : 9,
              backgroundColor: on ? theme.ink : 'transparent',
            }}
          >
            <Text style={{ fontSize: compact ? 12 : 13, fontWeight: on ? '500' : '400', color: on ? theme.onInk : theme.textSecondary }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

