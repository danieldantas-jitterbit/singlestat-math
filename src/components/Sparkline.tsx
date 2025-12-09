import React from 'react';

interface SparklineProps {
  pairs: Array<[number, number | null]>;
  width: number;
  height: number;
  color: string;
  fill: string;
  full: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({ pairs, width, height, color, fill, full }) => {
  const validPoints = pairs.filter(([, value]) => value !== null && value !== undefined) as Array<[number, number]>;
  if (validPoints.length < 2 || width <= 0 || height <= 0) {
    return null;
  }

  const marginY = full ? 6 : 2;
  const sparklineHeight = full ? Math.max(height - marginY * 2, 20) : Math.max(Math.floor(height * 0.25), 20);
  const minTime = validPoints.reduce((acc, [time]) => Math.min(acc, time), validPoints[0][0]);
  const maxTime = validPoints.reduce((acc, [time]) => Math.max(acc, time), validPoints[0][0]);
  const minValue = validPoints.reduce((acc, [, value]) => Math.min(acc, value), validPoints[0][1]);
  const maxValue = validPoints.reduce((acc, [, value]) => Math.max(acc, value), validPoints[0][1]);
  const timeRange = maxTime === minTime ? 1 : maxTime - minTime;
  const valueRange = maxValue === minValue ? 1 : maxValue - minValue;

  const coords = validPoints.map(([time, value]) => {
    const x = ((time - minTime) / timeRange) * width;
    const relativeY = valueRange === 0 ? 0.5 : (value - minValue) / valueRange;
    const y = sparklineHeight - relativeY * sparklineHeight;
    return { x, y };
  });

  const path = coords
    .map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  const areaPath = [
    'M',
    coords[0].x.toFixed(2),
    sparklineHeight.toFixed(2),
    path.replace('M', 'L'),
    'L',
    coords[coords.length - 1].x.toFixed(2),
    sparklineHeight.toFixed(2),
    'Z',
  ].join(' ');

  const style = {
    height: sparklineHeight,
    bottom: full ? `${marginY}px` : '0px',
    left: 0,
  } as React.CSSProperties;

  return (
    <svg className="singlestatmath-panel__sparkline" width={width} height={sparklineHeight} style={style} aria-hidden>
      <path d={areaPath} fill={fill} opacity={0.35} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
};
