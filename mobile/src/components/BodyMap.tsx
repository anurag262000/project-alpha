/**
 * Anatomical muscle map — see design/anatomy/muscles.json for the shapes.
 *
 *   <BodyMap highlight={{ chest: 'primary', triceps: 'secondary' }} />
 *   <BodyMap view="both" split="pull" size={120} />
 *
 * Red is the drive/intensity signal (design-system.md), so a worked muscle is
 * red at full strength for primary and 42% for secondary; everything else stays
 * grey. Unknown keys (traps, forearms) simply never light up.
 */
import React from 'react';
import { View } from 'react-native';
import Svg, { Ellipse, G, Path, Rect } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import {
  BODY_MIRROR,
  BODY_MUSCLE_WIDTH,
  BODY_OUTLINE_WIDTH,
  BODY_VIEW_BOX,
  MUSCLES,
  SILHOUETTE,
  SPLITS,
  type BodyShape,
  type BodyView,
  type MuscleKey,
} from './bodyMap.gen';

export type MuscleEmphasis = 'primary' | 'secondary';
export type Highlight = Partial<Record<MuscleKey, MuscleEmphasis>>;

const SECONDARY_OPACITY = 0.45;

/** Aspect ratio of the artwork, so callers only ever pass a width. */
const [, , VB_W, VB_H] = BODY_VIEW_BOX.split(' ').map(Number);

type Ink = { fill: string; stroke: string; strokeWidth: number; strokeLinejoin: 'round' };

function Shape({ shape, ink }: { shape: BodyShape; ink: Ink }) {
  if (shape.p) return <Path d={shape.p} {...ink} />;
  if (shape.e) {
    const [cx, cy, rx, ry] = shape.e;
    return <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} {...ink} />;
  }
  const [x, y, width, height, rx] = shape.r!;
  return <Rect x={x} y={y} width={width} height={height} rx={rx} {...ink} />;
}

/** Lateral shapes are drawn twice — the second time reflected about the spine. */
function Mirrored({ mirror, children }: { mirror?: boolean; children: React.ReactNode }) {
  if (!mirror) return <>{children}</>;
  return (
    <>
      {children}
      <G transform={BODY_MIRROR}>{children}</G>
    </>
  );
}

function Body({
  view,
  highlight,
  width,
}: {
  view: BodyView;
  highlight: Highlight;
  width: number;
}) {
  const { theme, name } = useTheme();
  const dark = name === 'dark';
  const outline = dark ? '#0A0B0D' : '#2C3040';
  const bodyFill = dark ? '#2A2D34' : '#E2E3E7';
  const restFill = dark ? '#3E424B' : '#C2C5CC';

  return (
    <Svg width={width} height={(width * VB_H) / VB_W} viewBox={BODY_VIEW_BOX}>
      {SILHOUETTE[view].map((shape, i) => (
        <Mirrored key={`sil${i}`} mirror={shape.mirror}>
          <Shape
            shape={shape}
            ink={{
              fill: bodyFill,
              stroke: outline,
              strokeWidth: BODY_OUTLINE_WIDTH,
              strokeLinejoin: 'round',
            }}
          />
        </Mirrored>
      ))}
      {Object.entries(MUSCLES[view]).map(([key, group]) => {
        const emphasis = highlight[key as MuscleKey];
        const ink: Ink = {
          fill: emphasis ? theme.red : restFill,
          stroke: outline,
          strokeWidth: BODY_MUSCLE_WIDTH,
          strokeLinejoin: 'round',
        };
        return (
          <G key={key} opacity={emphasis === 'secondary' ? SECONDARY_OPACITY : 1}>
            <Mirrored mirror={group.mirror}>
              {group.shapes.map((shape, i) => (
                <Shape key={i} shape={shape} ink={ink} />
              ))}
            </Mirrored>
          </G>
        );
      })}
    </Svg>
  );
}

export function BodyMap({
  view = 'front',
  highlight,
  split,
  size = 132,
  gap = 8,
}: {
  /** 'both' renders front and back side by side — what a split needs. */
  view?: BodyView | 'both';
  highlight?: Highlight;
  /** Named split from design/anatomy/muscles.json; ignored when `highlight` is given. */
  split?: keyof typeof SPLITS | string;
  /** Width of one body. */
  size?: number;
  gap?: number;
}) {
  const resolved: Highlight = highlight ?? fromSplit(split);

  if (view !== 'both') return <Body view={view} highlight={resolved} width={size} />;
  return (
    <View style={{ flexDirection: 'row', gap }}>
      <Body view="front" highlight={resolved} width={size} />
      <Body view="back" highlight={resolved} width={size} />
    </View>
  );
}

function fromSplit(split?: string): Highlight {
  const preset = split ? SPLITS[split] : undefined;
  if (!preset) return {};
  const out: Highlight = {};
  for (const key of preset.secondary) out[key] = 'secondary';
  for (const key of preset.primary) out[key] = 'primary';
  return out;
}

/** Turn a day's exercises into a highlight map: primary muscles win over secondary. */
export function highlightFor(
  exercises: { primaryMuscle: string; secondaryMuscles?: string[] | null }[],
): Highlight {
  const out: Highlight = {};
  for (const ex of exercises) {
    for (const m of ex.secondaryMuscles ?? []) {
      if (!out[m as MuscleKey]) out[m as MuscleKey] = 'secondary';
    }
  }
  for (const ex of exercises) out[ex.primaryMuscle as MuscleKey] = 'primary';
  return out;
}
