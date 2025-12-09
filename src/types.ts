import { ThresholdsConfig, ThresholdsMode } from '@grafana/data';

export type ValueName =
  | 'min'
  | 'max'
  | 'avg'
  | 'current'
  | 'total'
  | 'name'
  | 'first'
  | 'delta'
  | 'diff'
  | 'range'
  | 'last_time';

export type NullPointMode = 'connected' | 'null' | 'null as zero';

export interface SparklineOptions {
  show: boolean;
  full: boolean;
  lineColor: string;
  fillColor: string;
}

export interface GaugeOptions {
  show: boolean;
  minValue: number;
  maxValue: number;
  thresholdMarkers: boolean;
  thresholdLabels: boolean;
}

export interface SinglestatMathOptions {
  math: string;
  valueName: ValueName;
  nullPointMode: NullPointMode;
  tableColumn?: string;
  prefix: string;
  postfix: string;
  prefixFontSize: string;
  postfixFontSize: string;
  valueFontSize: string;
  colorBackground: boolean;
  circleBackground: boolean;
  colorValue: boolean;
  valueMappingColorBackground: string;
  sparkline: SparklineOptions;
  gauge: GaugeOptions;
  tooltip: {
    show: boolean;
  };
}

export const FONT_SIZES = ['20%', '30%', '50%', '70%', '80%', '100%', '110%', '120%', '150%', '170%', '200%'];

export const VALUE_NAME_OPTIONS: Array<{ label: string; value: ValueName }> = [
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' },
  { value: 'avg', label: 'Average' },
  { value: 'current', label: 'Current' },
  { value: 'total', label: 'Total' },
  { value: 'name', label: 'Name' },
  { value: 'first', label: 'First' },
  { value: 'delta', label: 'Delta' },
  { value: 'diff', label: 'Difference' },
  { value: 'range', label: 'Range' },
  { value: 'last_time', label: 'Time of last point' },
];

export const defaultSparklineOptions: SparklineOptions = {
  show: false,
  full: false,
  lineColor: 'rgb(31, 120, 193)',
  fillColor: 'rgba(31, 118, 189, 0.18)',
};

export const defaultGaugeOptions: GaugeOptions = {
  show: false,
  minValue: 0,
  maxValue: 100,
  thresholdMarkers: true,
  thresholdLabels: false,
};

export const DEFAULT_THRESHOLDS: ThresholdsConfig = {
  mode: ThresholdsMode.Absolute,
  steps: [
    { value: -Infinity, color: 'green' },
    { value: 80, color: 'red' },
  ],
};

export const defaultOptions: SinglestatMathOptions = {
  math: '',
  valueName: 'avg',
  nullPointMode: 'connected',
  prefix: '',
  postfix: '',
  prefixFontSize: '50%',
  postfixFontSize: '50%',
  valueFontSize: '80%',
  colorBackground: false,
  circleBackground: false,
  colorValue: false,
  tableColumn: undefined,
  valueMappingColorBackground: '#767171',
  sparkline: defaultSparklineOptions,
  gauge: defaultGaugeOptions,
  tooltip: {
    show: true,
  },
};
