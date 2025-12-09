import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';

interface GaugeProps {
  width: number;
  height: number;
  min: number;
  max: number;
  value: number | null;
  thresholds: Array<{ value: number; color: string }>;
  showThresholdMarkers: boolean;
  showThresholdLabels: boolean;
  valueText: string;
  valueColor?: string;
  theme: GrafanaTheme2;
  fontScale: number;
}

export const Gauge: React.FC<GaugeProps> = ({
  width,
  height,
  min,
  max,
  value,
  thresholds,
  showThresholdMarkers,
  showThresholdLabels,
  valueText,
  valueColor,
  theme,
  fontScale,
}) => {
  const dimension = Math.min(width, height * 1.3);
  if (dimension <= 0) {
    return null;
  }

  const strokeWidth = Math.min(dimension / 12, 16);
  const radius = dimension / 2 - strokeWidth;
  const center = dimension / 2;
  const normalizedValue = normalize(value, min, max);
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const valueAngle = startAngle + (endAngle - startAngle) * normalizedValue;

  const trackPath = describeArc(center, center, radius, startAngle, endAngle);
  const valuePath = describeArc(center, center, radius, startAngle, valueAngle);
  const thresholdMarkers = showThresholdMarkers ? buildThresholdMarkers(thresholds, min, max, center, radius) : [];

  return (
    <div className="singlestatmath-panel__gauge">
      <svg width={dimension} height={dimension / 2 + strokeWidth} viewBox={`0 0 ${dimension} ${dimension}`} aria-hidden>
        <path d={trackPath} stroke={theme.colors.border.weak} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
        {value !== null && (
          <path d={valuePath} stroke={valueColor ?? theme.colors.primary.text} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
        )}
        {showThresholdMarkers &&
          thresholdMarkers.map((marker, idx) => (
            <g key={`threshold-${idx}`}>
              <line x1={marker.x1} y1={marker.y1} x2={marker.x2} y2={marker.y2} stroke={marker.color} strokeWidth={2} />
              {showThresholdLabels && (
                <text x={marker.labelX} y={marker.labelY} textAnchor="middle" fill={theme.colors.text.secondary} fontSize={10} dominantBaseline="middle">
                  {marker.value}
                </text>
              )}
            </g>
          ))}
        <text
          x={center}
          y={center + strokeWidth}
          textAnchor="middle"
          fill={valueColor ?? theme.colors.text.primary}
          fontSize={Math.min(dimension / 5, 100) * fontScale}
          fontWeight={600}
          dominantBaseline="middle"
        >
          {valueText}
        </text>
      </svg>
    </div>
  );
};

function normalize(value: number | null, min: number, max: number) {
  if (value === null || value === undefined) {
    return 0;
  }
  if (max === min) {
    return 1;
  }
  const clamped = Math.min(Math.max(value, min), max);
  return (clamped - min) / (max - min);
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= Math.PI ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(cx: number, cy: number, radius: number, angleInRadians: number) {
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function buildThresholdMarkers(
  thresholds: Array<{ value: number; color: string }>,
  min: number,
  max: number,
  center: number,
  radius: number
) {
  const markers: Array<{ x1: number; y1: number; x2: number; y2: number; labelX: number; labelY: number; value: number; color: string }> = [];
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;

  thresholds.forEach((threshold) => {
    if (threshold.value > max || threshold.value < min) {
      return;
    }
    const normalized = (threshold.value - min) / (max - min || 1);
    const angle = startAngle + (endAngle - startAngle) * normalized;
    const outer = polarToCartesian(center, center, radius + 4, angle);
    const inner = polarToCartesian(center, center, radius - 6, angle);
    const label = polarToCartesian(center, center, radius + 18, angle);
    markers.push({
      x1: inner.x,
      y1: inner.y,
      x2: outer.x,
      y2: outer.y,
      labelX: label.x,
      labelY: label.y,
      value: threshold.value,
      color: threshold.color,
    });
  });

  return markers;
}
