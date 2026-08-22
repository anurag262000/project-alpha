/**
 * The app's own icon set — see design/icons/icons.json for the source and
 * design/icons/gallery.html for the sheet. Line icons on a 24 grid, stroked
 * with `currentColor`; a handful carry solid accents (`f` paths).
 *
 *   <Icon name="chevron-right" />
 *   <Icon name="streak" size={16} color={theme.red} />
 *
 * Colour defaults to the theme's primary text, so an icon in a row of text
 * matches it without being told to.
 */
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { ICONS, ICON_GRID, ICON_STROKE, type IconName } from './icons.gen';

export type { IconName };

export function Icon({
  name,
  size = 22,
  color,
  strokeWidth = ICON_STROKE,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const { theme } = useTheme();
  const tint = color ?? theme.textPrimary;
  const icon = ICONS[name];

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${ICON_GRID} ${ICON_GRID}`} fill="none">
      {icon.d?.map((d, i) => (
        <Path
          key={`s${i}`}
          d={d}
          stroke={tint}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {icon.f?.map((d, i) => (
        <Path key={`f${i}`} d={d} fill={tint} />
      ))}
    </Svg>
  );
}
