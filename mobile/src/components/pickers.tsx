import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { Cap, LabeledField, Segmented } from './ui';
import { KG_PER_LB, cmToFtIn, fromIsoDate, ftInToCm, round1, splitTenths, toIsoDate } from '@/lib/units';

export { fromIsoDate, toIsoDate };

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// --- Sheet -----------------------------------------------------------------

/**
 * Bottom sheet for pickers. Deliberately the opaque `card` surface, not glass:
 * design-system.md keeps glass for containers and makes anything that needs
 * contrast and affordance solid — a picker read through the ambient glow is
 * unusable.
 */
function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        {/*
          The backdrop is a *sibling* of the sheet, not its parent. Wrapping the
          sheet in a Pressable (to swallow taps) puts a touch responder above the
          dials, and on Android that responder eats the drag — the wheels look
          right and simply never scroll. Taps on the sheet now bubble up to a
          View that ignores them, which is the same result without the ancestor.
        */}
        <Pressable
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10,11,13,0.45)' }]}
        />
        <View
          style={{
            backgroundColor: theme.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.track,
              marginBottom: 14,
            }}
          />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <Cap>{title}</Cap>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textPrimary }}>Done</Text>
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

// --- Date of birth ---------------------------------------------------------

/** Row showing the chosen date; opens a calendar sheet. ISO `YYYY-MM-DD`. */
export function DateField({
  value,
  onChange,
  minYear = 1920,
  error,
}: {
  value: string;
  onChange: (iso: string) => void;
  minYear?: number;
  error?: string;
}) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = fromIsoDate(value);

  return (
    <>
      <LabeledField label="Date of birth" onPress={() => setOpen(true)} error={error}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: selected ? theme.textPrimary : theme.textMuted }}>
          {selected
            ? `${selected.getDate()} ${MONTHS[selected.getMonth()].slice(0, 3)} ${selected.getFullYear()}`
            : 'Select your date of birth'}
        </Text>
        <MaterialCommunityIcons name="calendar-blank-outline" size={18} color={theme.textMuted} />
      </LabeledField>
      <Sheet visible={open} onClose={() => setOpen(false)} title="Date of birth">
        <CalendarGrid
          selected={selected}
          minYear={minYear}
          onSelect={(d) => {
            onChange(toIsoDate(d));
            setOpen(false);
          }}
        />
      </Sheet>
    </>
  );
}

function CalendarGrid({
  selected,
  minYear,
  onSelect,
}: {
  selected: Date | null;
  minYear: number;
  onSelect: (d: Date) => void;
}) {
  const { theme } = useTheme();
  const today = useMemo(() => new Date(), []);
  const maxYear = today.getFullYear();
  // Open on a plausible birth year rather than today, so nobody has to page
  // back three hundred months.
  const [view, setView] = useState(() => selected ?? new Date(maxYear - 25, 0, 1));

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Always six week-rows: a 4-, 5- or 6-row month would otherwise resize the
  // sheet under your thumb as you page through it.
  const cells: (number | null)[] = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDow + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  const step = (deltaMonths: number) => {
    const next = new Date(year, month + deltaMonths, 1);
    if (next.getFullYear() < minYear || next.getFullYear() > maxYear) return;
    setView(next);
  };

  const Spinner = ({ text, onPrev, onNext }: { text: string; onPrev: () => void; onNext: () => void }) => (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.fillSoft,
        borderRadius: 12,
        paddingHorizontal: 4,
        paddingVertical: 5,
      }}
    >
      <Pressable onPress={onPrev} hitSlop={8} style={{ padding: 4 }}>
        <MaterialCommunityIcons name="chevron-left" size={20} color={theme.textSecondary} />
      </Pressable>
      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textPrimary }}>{text}</Text>
      <Pressable onPress={onNext} hitSlop={8} style={{ padding: 4 }}>
        <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
      </Pressable>
    </View>
  );

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        <Spinner text={MONTHS[month]} onPrev={() => step(-1)} onNext={() => step(1)} />
        <Spinner text={String(year)} onPrev={() => step(-12)} onNext={() => step(12)} />
      </View>

      <View style={{ flexDirection: 'row' }}>
        {DOW.map((d, i) => (
          <Text
            key={i}
            style={{ flex: 1, textAlign: 'center', fontSize: 11, color: theme.textMuted, paddingVertical: 4 }}
          >
            {d}
          </Text>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((day, i) => {
          if (day === null) return <View key={`p${i}`} style={{ width: `${100 / 7}%`, height: 42 }} />;
          const date = new Date(year, month, day);
          const isFuture = date > today;
          const isSelected =
            !!selected &&
            selected.getFullYear() === year &&
            selected.getMonth() === month &&
            selected.getDate() === day;
          return (
            <View key={day} style={{ width: `${100 / 7}%`, height: 42, padding: 3 }}>
              <Pressable
                disabled={isFuture}
                onPress={() => onSelect(date)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 999,
                  backgroundColor: isSelected ? theme.ink : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: isSelected ? '600' : '400',
                    color: isSelected ? theme.onInk : isFuture ? theme.textDisabled : theme.textPrimary,
                  }}
                >
                  {day}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// --- Scroll dial -----------------------------------------------------------

const ITEM_H = 44;
const GAP = 14; // half the space between two columns leaning into each other
const VISIBLE = 5;
const DIAL_H = ITEM_H * VISIBLE;

/**
 * One snapping wheel column. Scroll position is the source of truth after
 * mount; `value` only pulls it back when something outside changes it.
 */
export function Dial({
  values,
  value,
  onChange,
  format = String,
  align = 'center',
}: {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  /** Two columns read as one number when they lean into each other. */
  align?: 'center' | 'left' | 'right';
}) {
  const { theme } = useTheme();
  const ref = useRef<ScrollView>(null);
  const index = Math.max(0, values.indexOf(value));
  const [active, setActive] = useState(index);
  // While a finger is on the wheel the native snap owns the offset; correcting
  // it from here mid-gesture is what leaves a column resting half a row off.
  const dragging = useRef(false);
  // The row this wheel last put itself on. A value that comes back to us as
  // the echo of our own scroll must not trigger a correcting scrollTo: that
  // animation lands on top of the native snap and the column rests off-grid.
  const settled = useRef(index);

  useEffect(() => {
    if (dragging.current || index === settled.current) return;
    settled.current = index;
    setActive(index);
    ref.current?.scrollTo({ y: index * ITEM_H, animated: true });
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  const indexAt = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    clamp(Math.round(e.nativeEvent.contentOffset.y / ITEM_H), 0, values.length - 1);

  const commit = (e: NativeSyntheticEvent<NativeScrollEvent>, snap: boolean) => {
    dragging.current = false;
    const i = indexAt(e);
    settled.current = i;
    // Whatever left it off-grid — an interrupted snap, a clamped index — the
    // wheel is only allowed to come to rest on a row. Never during a drag:
    // momentum is still to come and would fight it.
    if (snap && Math.abs(e.nativeEvent.contentOffset.y - i * ITEM_H) > 0.5) {
      ref.current?.scrollTo({ y: i * ITEM_H, animated: true });
    }
    const v = values[i];
    if (v !== value) onChange(v);
  };

  return (
    <ScrollView
      ref={ref}
      style={{ flex: 1, height: DIAL_H }}
      contentContainerStyle={{ paddingVertical: ITEM_H * ((VISIBLE - 1) / 2) }}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      scrollEventThrottle={16}
      // Not onLayout: on Android the ScrollView lays out before its content is
      // measured, so scrolling from there is a no-op and the wheel opens on its
      // first item. onContentSizeChange also re-centres on a unit switch.
      onContentSizeChange={() => ref.current?.scrollTo({ y: index * ITEM_H, animated: false })}
      onScroll={(e) => setActive(indexAt(e))}
      onScrollBeginDrag={() => {
        dragging.current = true;
      }}
      onScrollEndDrag={(e) => commit(e, false)}
      onMomentumScrollEnd={(e) => commit(e, true)}
    >
      {values.map((v, i) => {
        const d = Math.abs(i - active);
        return (
          <View
            key={v}
            style={{
              height: ITEM_H,
              justifyContent: 'center',
              alignItems: align === 'center' ? 'center' : align === 'left' ? 'flex-start' : 'flex-end',
              paddingLeft: align === 'left' ? GAP : 0,
              paddingRight: align === 'right' ? GAP : 0,
            }}
          >
            <Text
              style={{
                fontSize: d === 0 ? 26 : 16,
                fontWeight: d === 0 ? '700' : '400',
                // A fixed line box keeps both columns on the same baseline even
                // though the selected row is ten points bigger.
                lineHeight: ITEM_H,
                textAlignVertical: 'center',
                color: d === 0 ? theme.onInk : d === 1 ? theme.textMuted : theme.textDisabled,
              }}
            >
              {format(v)}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ponytail: plain ScrollViews render every notch (~490 rows worst case, lb).
// Swap in a FlatList if the wheel ever feels heavy on a low-end device.
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
const TENTHS = range(0, 9);

/** The wheels with the ink selection band behind them — the dial pattern. */
function DialRow({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={{ position: 'relative' }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: (DIAL_H - ITEM_H) / 2 - 4,
          height: ITEM_H + 8,
          borderRadius: 14,
          backgroundColor: theme.ink,
        }}
      />
      <View style={{ flexDirection: 'row' }}>{children}</View>
    </View>
  );
}

/** Value + inline unit tabs, tapping the row opens the dial sheet. */
function DialField<U extends string>({
  label,
  value,
  unit,
  units,
  onUnit,
  error,
  muted,
  children,
}: {
  label: string;
  value: string;
  unit: U;
  units: { label: string; value: U }[];
  onUnit: (u: U) => void;
  error?: string;
  /** Nothing chosen yet: the value line reads as a placeholder. */
  muted?: boolean;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <>
      <LabeledField label={label} onPress={() => setOpen(true)} error={error}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 15, fontWeight: '500', color: muted ? theme.textMuted : theme.textPrimary }}>
            {value}
          </Text>
          <MaterialCommunityIcons name="unfold-more-horizontal" size={16} color={theme.textMuted} />
        </View>
        <Segmented compact value={unit} onChange={onUnit} options={units} style={{ width: 84 }} />
      </LabeledField>
      <Sheet visible={open} onClose={() => setOpen(false)} title={label}>
        {children}
        <Text style={{ fontSize: 11, color: theme.textMuted, textAlign: 'center', marginTop: 10 }}>
          scroll to dial · no keyboard
        </Text>
      </Sheet>
    </>
  );
}

// --- Height ----------------------------------------------------------------

const MIN_CM = 100;
const MAX_CM = 250;
const CMS = range(MIN_CM, MAX_CM);
const FEET = range(3, 8);
const INCHES = range(0, 11);

/**
 * Height on the same dial as weight — one column in cm, feet + inches in
 * imperial. `onChange` always reports centimetres.
 */
export function HeightField({
  valueCm,
  onChange,
  error,
}: {
  valueCm: number | null;
  onChange: (cm: number | null) => void;
  error?: string;
}) {
  const [unit, setUnit] = useState<'cm' | 'ft'>('cm');
  // No value yet: the wheels open on a plausible height and Done commits it.
  const cm = clamp(valueCm ?? 170, MIN_CM, MAX_CM);
  const { ft, inch } = cmToFtIn(cm);

  return (
    <DialField
      label="Height"
      value={
        valueCm === null ? 'Select your height' : unit === 'cm' ? `${Math.round(cm)} cm` : `${ft}′ ${inch}″`
      }
      muted={valueCm === null}
      unit={unit}
      units={[
        { label: 'cm', value: 'cm' },
        { label: 'ft', value: 'ft' },
      ]}
      onUnit={setUnit}
      error={error}
    >
      <DialRow>
        {unit === 'cm' ? (
          <Dial values={CMS} value={Math.round(cm)} onChange={onChange} />
        ) : (
          <>
            <Dial
              key="ft"
              values={FEET}
              value={ft}
              onChange={(f) => onChange(ftInToCm(f, inch))}
              format={(f) => `${f}′`}
              align="right"
            />
            <Dial
              key="in"
              values={INCHES}
              value={inch}
              onChange={(i) => onChange(ftInToCm(ft, i))}
              format={(i) => `${i}″`}
              align="left"
            />
          </>
        )}
      </DialRow>
    </DialField>
  );
}

// --- Weight ----------------------------------------------------------------

const MIN_KG = 30;
const MAX_KG = 250;

/**
 * Weight on a two-column dial (whole + tenths) in a sheet. Keeping the wheels
 * out of the page means they can't fight the screen's own scrolling, and the
 * step fits without scrolling at all. `onChange` always reports kilograms.
 */
export function WeightField({
  valueKg,
  onChange,
}: {
  valueKg: number;
  onChange: (kg: number) => void;
}) {
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');

  const total = unit === 'kg' ? valueKg : valueKg / KG_PER_LB;
  const majors = unit === 'kg'
    ? range(MIN_KG, MAX_KG)
    : range(Math.ceil(MIN_KG / KG_PER_LB), Math.floor(MAX_KG / KG_PER_LB));

  // round1 first: the lb⇄kg round trip leaves floating-point dust that would
  // otherwise land the tenths wheel one notch off what the user just picked.
  const { whole, tenth } = splitTenths(round1(total));
  const major = clamp(whole, majors[0], majors[majors.length - 1]);

  const emit = (m: number, t: number) => {
    const v = m + t / 10;
    // kg is rounded to the tenth the wheels show; lb is stored at full
    // precision, because rounding *that* to 0.1 kg is a different weight in
    // pounds — the wheel would read back a tenth away from where it stopped.
    onChange(unit === 'kg' ? round1(v) : v * KG_PER_LB);
  };

  return (
    <DialField
      label="Weight"
      value={`${round1(total)} ${unit}`}
      unit={unit}
      units={[
        { label: 'kg', value: 'kg' },
        { label: 'lb', value: 'lb' },
      ]}
      onUnit={setUnit}
    >
      <DialRow>
        <Dial
          key={`${unit}-major`}
          values={majors}
          value={major}
          onChange={(m) => emit(m, tenth)}
          align="right"
        />
        <Dial
          key={`${unit}-tenth`}
          values={TENTHS}
          value={tenth}
          onChange={(t) => emit(major, t)}
          format={(t) => `.${t}`}
          align="left"
        />
      </DialRow>
    </DialField>
  );
}
