import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  TextInput,
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
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(10,11,13,0.45)', justifyContent: 'flex-end' }}
      >
        {/* Swallow taps inside the sheet so they don't dismiss it. */}
        <Pressable onPress={() => {}}>
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
        </Pressable>
      </Pressable>
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
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

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

// --- Height ----------------------------------------------------------------

/**
 * Height typed inline, with the unit toggle in the same row rather than on a
 * line of its own. `onChange` always reports centimetres.
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
  const { theme } = useTheme();
  const [unit, setUnit] = useState<'cm' | 'ft'>('cm');
  const [cmText, setCmText] = useState(valueCm ? String(valueCm) : '');
  const [ft, setFt] = useState('');
  const [inch, setInch] = useState('');

  const switchUnit = (next: 'cm' | 'ft') => {
    if (next === unit) return;
    if (next === 'ft') {
      if (valueCm) {
        const { ft: f, inch: i } = cmToFtIn(valueCm);
        setFt(String(f));
        setInch(String(i));
      }
    } else if (valueCm) {
      setCmText(String(round1(valueCm)));
    }
    setUnit(next);
  };

  const onCm = (t: string) => {
    setCmText(t);
    const n = parseFloat(t);
    onChange(Number.isFinite(n) ? n : null);
  };

  const onImperial = (f: string, i: string) => {
    setFt(f);
    setInch(i);
    if (f === '' && i === '') return onChange(null);
    const cm = ftInToCm(parseInt(f, 10) || 0, parseFloat(i) || 0);
    onChange(cm > 0 ? cm : null);
  };

  const input = { fontSize: 15, color: theme.textPrimary, paddingVertical: 6 } as const;

  return (
    <LabeledField label="Height" error={error}>
      {unit === 'cm' ? (
        <TextInput
          value={cmText}
          onChangeText={onCm}
          placeholder="e.g. 178"
          placeholderTextColor={theme.textMuted}
          keyboardType="numeric"
          maxLength={5}
          style={[input, { flex: 1 }]}
        />
      ) : (
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            value={ft}
            onChangeText={(t) => onImperial(t, inch)}
            placeholder="5"
            placeholderTextColor={theme.textMuted}
            keyboardType="numeric"
            maxLength={1}
            style={[input, { minWidth: 18 }]}
          />
          <Text style={{ fontSize: 14, color: theme.textMuted, marginRight: 10 }}>′</Text>
          <TextInput
            value={inch}
            onChangeText={(t) => onImperial(ft, t)}
            placeholder="10"
            placeholderTextColor={theme.textMuted}
            keyboardType="numeric"
            maxLength={2}
            style={[input, { minWidth: 24 }]}
          />
          <Text style={{ fontSize: 14, color: theme.textMuted }}>″</Text>
        </View>
      )}
      <Segmented
        compact
        value={unit}
        onChange={switchUnit}
        options={[
          { label: 'cm', value: 'cm' },
          { label: 'ft', value: 'ft' },
        ]}
        style={{ width: 84 }}
      />
    </LabeledField>
  );
}

// --- Scroll dial -----------------------------------------------------------

const ITEM_H = 44;
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
}: {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const { theme } = useTheme();
  const ref = useRef<ScrollView>(null);
  const index = Math.max(0, values.indexOf(value));
  const [active, setActive] = useState(index);
  const initial = useRef(index).current;

  useEffect(() => {
    if (index !== active) {
      setActive(index);
      ref.current?.scrollTo({ y: index * ITEM_H, animated: true });
    }
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  const indexAt = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    clamp(Math.round(e.nativeEvent.contentOffset.y / ITEM_H), 0, values.length - 1);

  const commit = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const v = values[indexAt(e)];
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
      onLayout={() => ref.current?.scrollTo({ y: initial * ITEM_H, animated: false })}
      onScroll={(e) => setActive(indexAt(e))}
      onScrollEndDrag={commit}
      onMomentumScrollEnd={commit}
    >
      {values.map((v, i) => {
        const d = Math.abs(i - active);
        return (
          <View key={v} style={{ height: ITEM_H, alignItems: 'center', justifyContent: 'center' }}>
            <Text
              style={{
                fontSize: d === 0 ? 26 : 16,
                fontWeight: d === 0 ? '700' : '400',
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

// --- Weight ----------------------------------------------------------------

const MIN_KG = 30;
const MAX_KG = 250;

// ponytail: plain ScrollViews render every notch (~490 rows worst case, lb).
// Swap in a FlatList if the wheel ever feels heavy on a low-end device.
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
const TENTHS = range(0, 9);

/**
 * Row showing the current weight; opens the dial in a sheet. Keeping the wheels
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
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');

  const total = unit === 'kg' ? valueKg : valueKg / KG_PER_LB;
  const majors = unit === 'kg'
    ? range(MIN_KG, MAX_KG)
    : range(Math.ceil(MIN_KG / KG_PER_LB), Math.floor(MAX_KG / KG_PER_LB));

  const { whole, tenth } = splitTenths(total);
  const major = clamp(whole, majors[0], majors[majors.length - 1]);

  const emit = (m: number, t: number) => {
    const v = m + t / 10;
    onChange(round1(unit === 'kg' ? v : v * KG_PER_LB));
  };

  return (
    <>
      <LabeledField label="Weight" onPress={() => setOpen(true)}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: theme.textPrimary }}>
          {`${round1(total)} ${unit}`}
        </Text>
        <MaterialCommunityIcons name="unfold-more-horizontal" size={18} color={theme.textMuted} />
      </LabeledField>

      <Sheet visible={open} onClose={() => setOpen(false)} title="Weight">
        <Segmented
          value={unit}
          onChange={setUnit}
          options={[
            { label: 'Kilograms', value: 'kg' },
            { label: 'Pounds', value: 'lb' },
          ]}
          style={{ marginBottom: 14 }}
        />

        <View style={{ flexDirection: 'row' }}>
          <Cap style={{ flex: 1, textAlign: 'center', paddingBottom: 6 }}>{unit}</Cap>
          <Cap style={{ flex: 1, textAlign: 'center', paddingBottom: 6 }}>
            {unit === 'kg' ? 'grams' : '0.1 lb'}
          </Cap>
        </View>

        <View style={{ position: 'relative' }}>
          {/* Ink selection band — the dial pattern from design-system.md. */}
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
          <View style={{ flexDirection: 'row' }}>
            <Dial
              key={`${unit}-major`}
              values={majors}
              value={major}
              onChange={(m) => emit(m, tenth)}
            />
            <Dial
              key={`${unit}-tenth`}
              values={TENTHS}
              value={tenth}
              onChange={(t) => emit(major, t)}
              format={(t) => (unit === 'kg' ? String(t * 100).padStart(3, '0') : `.${t}`)}
            />
          </View>
        </View>

        <Text style={{ fontSize: 11, color: theme.textMuted, textAlign: 'center', marginTop: 10 }}>
          scroll to dial · no keyboard
          {unit === 'lb' ? `  ·  ${round1(valueKg)} kg` : ''}
        </Text>
      </Sheet>
    </>
  );
}
