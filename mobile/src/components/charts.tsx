import Svg, { Circle, G, Polyline } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';

const OUTER_R = 52;
const INNER_R = 39;
const circumference = (r: number) => 2 * Math.PI * r;

/**
 * Dual activity ring: outer green = steps vs goal, inner red = points vs goal.
 * Both clamp at a full ring so an overachieving day does not wrap around.
 */
export function ActivityRings({
  size = 86,
  stepProgress = 0,
  pointProgress = 0,
}: {
  size?: number;
  stepProgress?: number;
  pointProgress?: number;
}) {
  const { theme } = useTheme();
  const arc = (r: number, progress: number) => {
    const c = circumference(r);
    const filled = Math.max(0, Math.min(1, progress)) * c;
    return `${filled} ${c}`;
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Circle cx={60} cy={60} r={OUTER_R} stroke={theme.track} strokeWidth={9} fill="none" />
      <G rotation={-90} originX={60} originY={60}>
        <Circle
          cx={60}
          cy={60}
          r={OUTER_R}
          stroke={theme.green}
          strokeWidth={9}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={arc(OUTER_R, stepProgress)}
        />
      </G>
      <Circle cx={60} cy={60} r={INNER_R} stroke={theme.track} strokeWidth={9} fill="none" />
      <G rotation={-90} originX={60} originY={60}>
        <Circle
          cx={60}
          cy={60}
          r={INNER_R}
          stroke={theme.red}
          strokeWidth={9}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={arc(INNER_R, pointProgress)}
        />
      </G>
    </Svg>
  );
}

/**
 * Mini trend line over an arbitrary series. Scaled to the series' own range
 * so small real changes (a 2 kg drop) stay visible.
 */
export function TrendLine({
  values,
  height = 66,
  color,
}: {
  values: number[];
  height?: number;
  color?: string;
}) {
  const { theme } = useTheme();
  const stroke = color ?? theme.green;

  if (values.length < 2) {
    return (
      <Svg width="100%" height={height} viewBox="0 0 260 66" preserveAspectRatio="none">
        <Polyline points="0,33 260,33" fill="none" stroke={theme.track} strokeWidth={2.5} strokeLinecap="round" />
      </Svg>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 8;
  const usable = 66 - pad * 2;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 260;
      const y = pad + (1 - (v - min) / span) * usable;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const lastX = 260;
  const lastY = pad + (1 - (values[values.length - 1] - min) / span) * usable;

  return (
    <Svg width="100%" height={height} viewBox="0 0 260 66" preserveAspectRatio="none">
      <Polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={lastX} cy={lastY} r={3.5} fill={stroke} />
    </Svg>
  );
}
