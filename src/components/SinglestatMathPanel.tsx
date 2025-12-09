import React, { useMemo, useEffect } from 'react';
import { cx } from '@emotion/css';
import {
  DataFrame,
  DisplayValue,
  Field,
  FieldConfig,
  FieldType,
  GrafanaTheme2,
  getActiveThreshold,
  getDisplayProcessor,
  PanelProps,
  ScopedVars,
  ThresholdsConfig,
  dateTimeFormat,
} from '@grafana/data';
import { PanelDataErrorView } from '@grafana/runtime';
import { useTheme2 } from '@grafana/ui';
import { SinglestatMathOptions, defaultOptions, DEFAULT_THRESHOLDS } from '../types';
import { buildSeriesFromFrame, ProcessedSeries } from '../utils/series';
import { evaluateMathExpression } from '../utils/math';
import { Sparkline } from './Sparkline';
import { Gauge } from './Gauge';
import '../css/panel_singlestatmath.scss';

interface PanelValueResult {
  displayValue: DisplayValue;
  numericValue: number | null;
  textValue: string;
  sparklinePairs: Array<[number, number | null]>;
  scopedVars: ScopedVars;
  seriesName?: string;
  thresholds: Array<{ value: number; color: string }>;
  thresholdColor?: string;
  isTable: boolean;
}

export const SinglestatMathPanel: React.FC<PanelProps<SinglestatMathOptions>> = (props) => {
  const { data, width, height, fieldConfig, options, replaceVariables, timeZone, onOptionsChange, id } = props;
  const theme = useTheme2();
  const normalizedOptions = useMemo(() => ({ ...defaultOptions, ...options }), [options]);

  const firstFrame = data.series[0];
  const isTable = firstFrame ? isTableFrame(firstFrame) : false;

  useEffect(() => {
    if (isTable && firstFrame && !normalizedOptions.tableColumn) {
      const defaultColumn = getDefaultTableColumn(firstFrame);
      if (defaultColumn && onOptionsChange) {
        onOptionsChange({ ...normalizedOptions, tableColumn: defaultColumn });
      }
    }
  }, [firstFrame, isTable, normalizedOptions, onOptionsChange]);

  const valueResult = useMemo(() => {
    if (!data.series.length) {
      return null;
    }
    return getPanelValue({
      data,
      fieldConfig,
      options: normalizedOptions,
      theme,
      timeZone,
    });
  }, [data, fieldConfig, normalizedOptions, theme, timeZone]);

  if (!data.series.length || !valueResult) {
    return <PanelDataErrorView panelId={id} data={data} fieldConfig={fieldConfig} />;
  }

  const scopedVars = valueResult.scopedVars;
  const prefix = normalizedOptions.prefix ? replaceVariables(normalizedOptions.prefix, scopedVars) : '';
  const postfix = normalizedOptions.postfix ? replaceVariables(normalizedOptions.postfix, scopedVars) : '';
  const valueText = valueResult.displayValue.text ?? valueResult.textValue;
  const prefixedValue = valueText;
  const valueFontScale = parseFontScale(normalizedOptions.valueFontSize);

  const thresholdColor = valueResult.thresholdColor;
  const backgroundColor = normalizedOptions.colorBackground
    ? valueResult.numericValue === null
      ? normalizedOptions.valueMappingColorBackground
      : thresholdColor
    : undefined;
  const valueColor = normalizedOptions.colorValue && valueText ? thresholdColor : undefined;

  const circleStyles = normalizedOptions.circleBackground
    ? {
        borderRadius: '50%',
        width: `${Math.min(width, height)}px`,
        height: `${Math.min(width, height)}px`,
      }
    : {};

  return (
    <div
      className={cx('singlestatmath-panel', normalizedOptions.circleBackground && 'singlestatmath-panel--circle')}
      style={{ backgroundColor, ...circleStyles }}
    >
      {!normalizedOptions.gauge.show && (
        <div className="singlestatmath-panel-value-container" style={{ fontSize: normalizedOptions.valueFontSize }}>
          {prefix && (
            <span className="singlestatmath-panel-prefix" style={{ fontSize: normalizedOptions.prefixFontSize }}>
              {prefix}
            </span>
          )}
          <span className="singlestatmath-panel-value" style={{ color: valueColor }}>
            {prefixedValue}
          </span>
          {postfix && (
            <span className="singlestatmath-panel-postfix" style={{ fontSize: normalizedOptions.postfixFontSize }}>
              {postfix}
            </span>
          )}
        </div>
      )}

      {normalizedOptions.gauge.show && (
        <Gauge
          width={width}
          height={height}
          min={normalizedOptions.gauge.minValue}
          max={normalizedOptions.gauge.maxValue}
          value={valueResult.numericValue}
          thresholds={valueResult.thresholds}
          showThresholdMarkers={normalizedOptions.gauge.thresholdMarkers}
          showThresholdLabels={normalizedOptions.gauge.thresholdLabels}
          valueText={`${prefix}${valueText}${postfix}`}
          valueColor={valueColor}
          theme={theme}
          fontScale={valueFontScale}
        />
      )}

      {normalizedOptions.sparkline.show && valueResult.sparklinePairs.length > 0 && (
        <Sparkline
          pairs={valueResult.sparklinePairs}
          width={width}
          height={height}
          color={normalizedOptions.sparkline.lineColor}
          fill={normalizedOptions.sparkline.fillColor}
          full={normalizedOptions.sparkline.full}
        />
      )}
    </div>
  );
};

function getPanelValue(args: {
  data: PanelProps<SinglestatMathOptions>['data'];
  fieldConfig: PanelProps<SinglestatMathOptions>['fieldConfig'];
  options: SinglestatMathOptions;
  theme: ReturnType<typeof useTheme2>;
  timeZone?: string;
}): PanelValueResult | null {
  const { data, fieldConfig, options, theme, timeZone } = args;
  const firstFrame = data.series[0];
  if (!firstFrame) {
    return null;
  }
  const isTable = isTableFrame(firstFrame);

  if (isTable) {
    return getTableValue(firstFrame, fieldConfig.defaults, options, theme, timeZone);
  }

  const processedSeries = data.series
    .map((frame, index) => buildSeriesFromFrame({ frame, alias: getSeriesAlias(frame, index), nullPointMode: options.nullPointMode }))
    .filter((series): series is ProcessedSeries => Boolean(series));

  if (!processedSeries.length) {
    return null;
  }

  const firstSeries = processedSeries[0];
  const scopedVars = buildScopedVars(firstSeries);
  let numericValue: number | null = null;
  let textValue = '';
  let sparklinePairs = firstSeries.flotpairs;

  if (options.valueName === 'name') {
    textValue = firstSeries.alias;
  } else if (typeof firstSeries.lastValue === 'string') {
    textValue = firstSeries.lastValue;
  } else if (options.valueName === 'last_time') {
    const timestamp = firstSeries.lastTime;
    if (timestamp !== null && timestamp !== undefined) {
      numericValue = timestamp;
      textValue = dateTimeFormat(timestamp, { timeZone });
    } else {
      textValue = 'no value';
    }
  } else {
    if (options.math.trim()) {
      numericValue = evaluateMathExpression(options.math, processedSeries, options.valueName);
      if (numericValue === null) {
        numericValue = 0;
      }
    } else {
      numericValue = getStatValue(firstSeries, options.valueName);
    }
  }

  const thresholdsConfig = fieldConfig.defaults?.thresholds ?? DEFAULT_THRESHOLDS;
  const displayValue = getDisplayValue(numericValue, textValue, fieldConfig.defaults, theme, timeZone);
  const thresholds = getResolvedThresholds(thresholdsConfig, theme);
  const thresholdColor = numericValue !== null ? getThresholdColorForValue(numericValue, thresholdsConfig, theme) : undefined;

  return {
    displayValue,
    numericValue: displayValue.numeric ?? numericValue,
    textValue: displayValue.text ?? textValue,
    sparklinePairs,
    scopedVars,
    thresholds,
    thresholdColor,
    isTable: false,
  };
}

function getTableValue(
  frame: DataFrame,
  fieldDefaults: FieldConfig,
  options: SinglestatMathOptions,
  theme: ReturnType<typeof useTheme2>,
  timeZone?: string
): PanelValueResult {
  const field = getTableField(frame, options.tableColumn);
  const scopedVars = buildTableScopedVars(field?.name);
  const rawValue = field ? field.values.get(0) : null;
  const numericValue = typeof rawValue === 'number' ? rawValue : null;
  const textValue = rawValue === null || rawValue === undefined ? 'no value' : String(rawValue);
  const thresholdsConfig = fieldDefaults?.thresholds ?? DEFAULT_THRESHOLDS;
  const displayValue = getDisplayValue(numericValue, textValue, fieldDefaults, theme, timeZone);
  const thresholds = getResolvedThresholds(thresholdsConfig, theme);
  const thresholdColor = numericValue !== null ? getThresholdColorForValue(numericValue, thresholdsConfig, theme) : undefined;
  return {
    displayValue,
    numericValue: displayValue.numeric ?? numericValue,
    textValue: displayValue.text ?? textValue,
    sparklinePairs: [],
    scopedVars,
    thresholds,
    thresholdColor,
    isTable: true,
  };
}

function getDisplayValue(
  numericValue: number | null,
  fallbackText: string,
  fieldDefaults: FieldConfig,
  theme: ReturnType<typeof useTheme2>,
  timeZone?: string
): DisplayValue {
  const field: Field = {
    name: '__value',
    type: FieldType.number,
    config: fieldDefaults ?? {},
    values: [],
  };
  const displayProcessor = getDisplayProcessor({ field, theme, timeZone });
  if (numericValue === null || numericValue === undefined) {
    return {
      text: fallbackText,
      numeric: Number.NaN,
    };
  }
  return displayProcessor(numericValue);
}

function getResolvedThresholds(thresholdsConfig: ThresholdsConfig, theme: GrafanaTheme2) {
  return thresholdsConfig.steps.map((step) => ({
    value: step.value,
    color: theme.visualization.getColorByName(step.color),
  }));
}

function getThresholdColorForValue(value: number, thresholdsConfig: ThresholdsConfig, theme: GrafanaTheme2) {
  const step = getActiveThreshold(value, thresholdsConfig.steps);
  return theme.visualization.getColorByName(step.color);
}

function getStatValue(series: ProcessedSeries, valueName: SinglestatMathOptions['valueName']) {
  switch (valueName) {
    case 'min':
      return series.stats.min;
    case 'max':
      return series.stats.max;
    case 'avg':
      return series.stats.avg;
    case 'current':
      return series.stats.current;
    case 'total':
      return series.stats.total;
    case 'first':
      return series.stats.first;
    case 'delta':
      return series.stats.delta;
    case 'diff':
      return series.stats.diff;
    case 'range':
      return series.stats.range;
    default:
      return series.stats.avg;
  }
}

function buildScopedVars(series: ProcessedSeries): ScopedVars {
  return {
    __name: {
      text: series.alias,
      value: series.alias,
    },
  };
}

function buildTableScopedVars(columnName?: string): ScopedVars {
  return {
    __name: {
      text: columnName ?? '',
      value: columnName ?? '',
    },
  };
}

function isTableFrame(frame: DataFrame) {
  return !frame.fields.some((field) => field.type === FieldType.time);
}

function getDefaultTableColumn(frame: DataFrame) {
  const candidate = frame.fields.find((field) => field.type !== FieldType.time);
  return candidate ? candidate.name : frame.fields[0]?.name;
}

function getTableField(frame: DataFrame, preferred?: string) {
  if (preferred) {
    const match = frame.fields.find((field) => field.name === preferred);
    if (match) {
      return match;
    }
  }
  return frame.fields.find((field) => field.type !== FieldType.time) ?? frame.fields[0];
}

function getSeriesAlias(frame: DataFrame, index: number) {
  return frame.name || frame.refId || frame.fields.find((field) => field.type === FieldType.number)?.name || `Series ${index + 1}`;
}

function parseFontScale(size: string) {
  if (!size) {
    return 1;
  }
  const numeric = parseFloat(size.replace('%', ''));
  if (!Number.isFinite(numeric)) {
    return 1;
  }
  return numeric / 100;
}
