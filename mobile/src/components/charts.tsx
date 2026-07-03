import Svg, { Circle, G, Polyline } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';

/** Dual activity ring: outer green = steps, inner red = active minutes. */
export function ActivityRings({ size = 86 }: { size?: number }) {
  const { theme } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Circle cx={60} cy={60} r={52} stroke={theme.track} strokeWidth={9} fill="none" />
      <G rotation={-90} originX={60} originY={60}>
        <Circle
          cx={60}
          cy={60}
          r={52}
          stroke={theme.green}
          strokeWidth={9}
          fill="none"
          strokeLinecap="round"
          strokeDasharray="228 327"
        />
      </G>
      <Circle cx={60} cy={60} r={39} stroke={theme.track} strokeWidth={9} fill="none" />
      <G rotation={-90} originX={60} originY={60}>
        <Circle
          cx={60}
          cy={60}
          r={39}
          stroke={theme.red}
          strokeWidth={9}
          fill="none"
          strokeLinecap="round"
          strokeDasharray="135 245"
        />
      </G>
    </Svg>
  );
}

/** Bodyweight trend mini-line. */
export function TrendLine({ height = 66 }: { height?: number }) {
  const { theme } = useTheme();
  return (
    <Svg width="100%" height={height} viewBox="0 0 260 66" preserveAspectRatio="none">
      <Polyline
        points="0,12 43,18 86,14 130,30 173,38 216,50 260,56"
        fill="none"
        stroke={theme.green}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={260} cy={56} r={3.5} fill={theme.green} />
    </Svg>
  );
}
