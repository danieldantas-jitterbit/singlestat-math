import { DataFrame, Field, FieldType } from '@grafana/data';
import { NullPointMode } from '../types';

export interface SeriesStats {
  total: number;
  max: number | null;
  min: number | null;
  avg: number | null;
  current: number | null;
  first: number | null;
  delta: number;
  diff: number | null;
  range: number | null;
  timeStep: number;
  count: number;
}

export interface ProcessedSeries {
  alias: string;
  label: string;
  stats: SeriesStats;
  flotpairs: Array<[number, number | null]>;
  allIsNull: boolean;
  allIsZero: boolean;
  lastValue: number | string | null;
  lastTime: number | null;
}

interface BuildSeriesArgs {
  frame: DataFrame;
  alias: string;
  nullPointMode: NullPointMode;
}

const DEFAULT_STATS: SeriesStats = {
  total: 0,
  max: null,
  min: null,
  avg: null,
  current: null,
  first: null,
  delta: 0,
  diff: null,
  range: null,
  timeStep: Number.MAX_VALUE,
  count: 0,
};

export function buildSeriesFromFrame({ frame, alias, nullPointMode }: BuildSeriesArgs): ProcessedSeries | null {
  const numericField = getNumericField(frame);
  if (!numericField) {
    return null;
  }
  const timeField = frame.fields.find((f) => f.type === FieldType.time);
  const datapoints: Array<[number | null, number | null]> = [];
  const length = numericField.values.length;
  for (let i = 0; i < length; i++) {
    const rawValue = numericField.values.get(i) as number | string | null | undefined;
    const numericValue = toNumber(rawValue);
    const rawTime = timeField ? (timeField.values.get(i) as number | string | Date | null | undefined) : i;
    const time = toTimestamp(rawTime, i);
    datapoints.push([numericValue, time]);
  }

  const statsResult = calculateSeriesStats(datapoints, nullPointMode);

  return {
    alias,
    label: alias,
    stats: statsResult.stats,
    flotpairs: statsResult.flotpairs,
    allIsNull: statsResult.allIsNull,
    allIsZero: statsResult.allIsZero,
    lastValue: statsResult.lastValue,
    lastTime: statsResult.lastTime,
  };
}

function calculateSeriesStats(datapoints: Array<[number | null, number | null]>, nullPointMode: NullPointMode) {
  const ignoreNulls = nullPointMode === 'connected';
  const nullAsZero = nullPointMode === 'null as zero';

  const stats: SeriesStats = { ...DEFAULT_STATS };
  const flotpairs: Array<[number, number | null]> = [];
  let allIsNull = true;
  let allIsZero = true;
  let nonNulls = 0;
  let previousValue = 0;
  let previousDeltaUp = true;
  let previousTime: number | null = null;
  let lastValue: number | string | null = null;
  let lastTime: number | null = null;

  for (let i = 0; i < datapoints.length; i++) {
    let currentValue = datapoints[i][0];
    const currentTime = datapoints[i][1];

    if (previousTime !== null && currentTime !== null) {
      const timeStep = currentTime - previousTime;
      if (timeStep < stats.timeStep) {
        stats.timeStep = timeStep;
      }
    }
    previousTime = currentTime;

    if (currentValue === null) {
      if (ignoreNulls) {
        continue;
      }
      if (nullAsZero) {
        currentValue = 0;
      }
    }

    const numericValue = toNumber(currentValue);

    if (numericValue !== null && isFinite(numericValue)) {
      stats.total += numericValue;
      allIsNull = false;
      nonNulls++;

      if (stats.max === null || numericValue > stats.max) {
        stats.max = numericValue;
      }
      if (stats.min === null || numericValue < stats.min) {
        stats.min = numericValue;
      }
      if (stats.first === null) {
        stats.first = numericValue;
      } else {
        if (previousValue > numericValue) {
          previousDeltaUp = false;
          if (i === datapoints.length - 1) {
            stats.delta += numericValue;
          }
        } else {
          if (previousDeltaUp) {
            stats.delta += numericValue - previousValue;
          } else {
            stats.delta += numericValue;
          }
          previousDeltaUp = true;
        }
      }
      previousValue = numericValue;

      if (numericValue !== 0) {
        allIsZero = false;
      }
    }

    flotpairs.push([currentTime ?? 0, numericValue]);
    lastValue = currentValue;
    lastTime = currentTime ?? lastTime;
  }

  if (stats.max === null && !allIsNull) {
    stats.max = 0;
  }
  if (stats.min === null && !allIsNull) {
    stats.min = 0;
  }

  if (datapoints.length && !allIsNull && nonNulls > 0) {
    stats.avg = stats.total / nonNulls;
    stats.current = flotpairs[flotpairs.length - 1][1];
    if (stats.current === null && flotpairs.length > 1) {
      stats.current = flotpairs[flotpairs.length - 2][1];
    }
  }

  if (stats.max !== null && stats.min !== null) {
    stats.range = stats.max - stats.min;
  }
  if (stats.current !== null && stats.first !== null) {
    stats.diff = stats.current - stats.first;
  }

  stats.count = flotpairs.length;

  return {
    stats,
    flotpairs,
    allIsNull,
    allIsZero,
    lastValue,
    lastTime,
  };
}

function getNumericField(frame: DataFrame): Field | undefined {
  return frame.fields.find((field) => field.type === FieldType.number);
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number') {
    return isFinite(value) ? value : null;
  }
  const parsed = parseFloat(value as string);
  return Number.isFinite(parsed) ? parsed : null;
}

function toTimestamp(value: number | string | Date | null | undefined, fallbackIndex: number): number | null {
  if (value === null || value === undefined) {
    return fallbackIndex;
  }
  if (value instanceof Date) {
    return value.valueOf();
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? fallbackIndex : parsed;
  }
  if (typeof value === 'number') {
    return value;
  }
  return fallbackIndex;
}
