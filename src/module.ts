import {
  FieldConfigProperty,
  MappingType,
  PanelMigrationHandler,
  PanelPlugin,
  SpecialValueMatch,
  ThresholdsConfig,
  ThresholdsMode,
  ValueMapping,
} from '@grafana/data';
import { SinglestatMathPanel } from './components/SinglestatMathPanel';
import {
  FONT_SIZES,
  SinglestatMathOptions,
  VALUE_NAME_OPTIONS,
  defaultOptions,
} from './types';

export const plugin = new PanelPlugin<SinglestatMathOptions>(SinglestatMathPanel)
  .useFieldConfig({
    standardOptions: {
      [FieldConfigProperty.Unit]: {},
      [FieldConfigProperty.Decimals]: {},
      [FieldConfigProperty.Mappings]: {},
      [FieldConfigProperty.Thresholds]: {},
    },
  })
  .setPanelOptions((builder) => {
    return builder
      .addTextInput({
        path: 'math',
        name: 'Math expression',
        description: 'Use series aliases as variables (example: A + B / 2)',
        defaultValue: defaultOptions.math,
      })
      .addSelect({
        path: 'valueName',
        name: 'Value',
        defaultValue: defaultOptions.valueName,
        settings: {
          options: VALUE_NAME_OPTIONS,
        },
      })
      .addSelect({
        path: 'nullPointMode',
        name: 'Null value mode',
        defaultValue: defaultOptions.nullPointMode,
        settings: {
          options: [
            { label: 'Connected', value: 'connected' },
            { label: 'As zero', value: 'null as zero' },
            { label: 'Null', value: 'null' },
          ],
        },
      })
      .addTextInput({
        path: 'tableColumn',
        name: 'Table column',
        description: 'Name of the table column to read when the query returns table data',
        defaultValue: defaultOptions.tableColumn,
      })
      .addTextInput({
        path: 'prefix',
        name: 'Prefix',
        defaultValue: defaultOptions.prefix,
      })
      .addSelect({
        path: 'prefixFontSize',
        name: 'Prefix font size',
        defaultValue: defaultOptions.prefixFontSize,
        settings: { options: FONT_SIZES.map((size) => ({ label: size, value: size })) },
      })
      .addTextInput({
        path: 'postfix',
        name: 'Postfix',
        defaultValue: defaultOptions.postfix,
      })
      .addSelect({
        path: 'postfixFontSize',
        name: 'Postfix font size',
        defaultValue: defaultOptions.postfixFontSize,
        settings: { options: FONT_SIZES.map((size) => ({ label: size, value: size })) },
      })
      .addSelect({
        path: 'valueFontSize',
        name: 'Value font size',
        defaultValue: defaultOptions.valueFontSize,
        settings: { options: FONT_SIZES.map((size) => ({ label: size, value: size })) },
      })
      .addBooleanSwitch({
        path: 'colorBackground',
        name: 'Color background',
        defaultValue: defaultOptions.colorBackground,
      })
      .addBooleanSwitch({
        path: 'circleBackground',
        name: 'Circle background',
        defaultValue: defaultOptions.circleBackground,
      })
      .addBooleanSwitch({
        path: 'colorValue',
        name: 'Color value text',
        defaultValue: defaultOptions.colorValue,
      })
      .addColorPicker({
        path: 'valueMappingColorBackground',
        name: 'No data background color',
        defaultValue: defaultOptions.valueMappingColorBackground,
      })
      .addBooleanSwitch({
        path: 'sparkline.show',
        name: 'Show sparkline',
        defaultValue: defaultOptions.sparkline.show,
      })
      .addBooleanSwitch({
        path: 'sparkline.full',
        name: 'Sparkline full height',
        defaultValue: defaultOptions.sparkline.full,
        showIf: (cfg) => cfg.sparkline?.show ?? false,
      })
      .addColorPicker({
        path: 'sparkline.lineColor',
        name: 'Sparkline line color',
        defaultValue: defaultOptions.sparkline.lineColor,
        showIf: (cfg) => cfg.sparkline?.show ?? false,
      })
      .addColorPicker({
        path: 'sparkline.fillColor',
        name: 'Sparkline fill color',
        defaultValue: defaultOptions.sparkline.fillColor,
        showIf: (cfg) => cfg.sparkline?.show ?? false,
      })
      .addBooleanSwitch({
        path: 'gauge.show',
        name: 'Show gauge',
        defaultValue: defaultOptions.gauge.show,
      })
      .addNumberInput({
        path: 'gauge.minValue',
        name: 'Gauge min value',
        defaultValue: defaultOptions.gauge.minValue,
        showIf: (cfg) => cfg.gauge?.show ?? false,
      })
      .addNumberInput({
        path: 'gauge.maxValue',
        name: 'Gauge max value',
        defaultValue: defaultOptions.gauge.maxValue,
        showIf: (cfg) => cfg.gauge?.show ?? false,
      })
      .addBooleanSwitch({
        path: 'gauge.thresholdMarkers',
        name: 'Show threshold markers',
        defaultValue: defaultOptions.gauge.thresholdMarkers,
        showIf: (cfg) => cfg.gauge?.show ?? false,
      })
      .addBooleanSwitch({
        path: 'gauge.thresholdLabels',
        name: 'Show threshold labels',
        defaultValue: defaultOptions.gauge.thresholdLabels,
        showIf: (cfg) => cfg.gauge?.show ?? false,
      });
  })
.setMigrationHandler(migratePanel);

function migratePanel(
  panel: Parameters<PanelMigrationHandler<SinglestatMathOptions>>[0]
): Partial<SinglestatMathOptions> {
  const legacy = panel as any;
  if (!panel.fieldConfig) {
    panel.fieldConfig = { defaults: {}, overrides: [] };
  }
  if (!panel.fieldConfig.defaults) {
    panel.fieldConfig.defaults = {};
  }
  const defaults = panel.fieldConfig.defaults;

  if (legacy.format && !defaults.unit) {
    defaults.unit = legacy.format;
  }

  if (legacy.decimals !== undefined && defaults.decimals === undefined) {
    defaults.decimals = legacy.decimals;
  }

  if (!defaults.thresholds) {
    const thresholds = convertThresholds(legacy);
    if (thresholds) {
      defaults.thresholds = thresholds;
    }
  }

  if (!defaults.mappings) {
    const mappings = convertMappings(legacy);
    if (mappings.length) {
      defaults.mappings = mappings;
    }
  }

  const merged: SinglestatMathOptions = {
    ...defaultOptions,
    ...(panel.options ?? {}),
  };

  merged.math = legacy.math ?? merged.math;
  merged.valueName = legacy.valueName ?? merged.valueName;
  merged.nullPointMode = legacy.nullPointMode ?? merged.nullPointMode;
  merged.tableColumn = legacy.tableColumn ?? merged.tableColumn;
  merged.prefix = legacy.prefix ?? merged.prefix;
  merged.postfix = legacy.postfix ?? merged.postfix;
  merged.prefixFontSize = legacy.prefixFontSize ?? merged.prefixFontSize;
  merged.postfixFontSize = legacy.postfixFontSize ?? merged.postfixFontSize;
  merged.valueFontSize = legacy.valueFontSize ?? merged.valueFontSize;
  merged.colorBackground = legacy.colorBackground ?? merged.colorBackground;
  merged.circleBackground = legacy.circleBackground ?? merged.circleBackground;
  merged.colorValue = legacy.colorValue ?? merged.colorValue;
  merged.valueMappingColorBackground = legacy.valueMappingColorBackground ?? merged.valueMappingColorBackground;
  merged.sparkline = {
    ...defaultOptions.sparkline,
    ...(panel.options?.sparkline ?? {}),
    ...(legacy.sparkline ?? {}),
  };
  merged.gauge = {
    ...defaultOptions.gauge,
    ...(panel.options?.gauge ?? {}),
    ...(legacy.gauge ?? {}),
  };
  merged.tooltip = {
    ...defaultOptions.tooltip,
    ...(panel.options?.tooltip ?? {}),
    ...(legacy.tooltip ?? {}),
  };

  return merged;
}

function convertThresholds(panel: any): ThresholdsConfig | undefined {
  const legacy = panel.thresholds;
  const colors: string[] = panel.colors ?? [];
  const defaultColor: string = panel.defaultColor ?? 'green';
  const values: Array<{ value: number; color?: string }> = [];

  if (Array.isArray(legacy)) {
    legacy.forEach((item: any) => {
      const value = Number(item?.value);
      if (!Number.isFinite(value)) {
        return;
      }
      values.push({ value, color: item?.color });
    });
  } else if (typeof legacy === 'string' && legacy.length) {
    legacy.split(',').forEach((item: string, idx: number) => {
      const parsed = Number(item.trim());
      if (Number.isFinite(parsed)) {
        values.push({ value: parsed, color: colors[idx] });
      }
    });
  }

  if (!values.length) {
    return undefined;
  }

  const steps = [
    {
      value: -Infinity,
      color: values[0].color ?? defaultColor,
    },
  ];

  values.forEach((entry) => {
    steps.push({ value: entry.value, color: entry.color ?? defaultColor });
  });

  return {
    mode: ThresholdsMode.Absolute,
    steps,
  };
}

function convertMappings(panel: any): ValueMapping[] {
  const mappings: ValueMapping[] = [];

  if (Array.isArray(panel.valueMaps) && panel.valueMaps.length) {
    const options: Record<string, { text: string }> = {};
    panel.valueMaps.forEach((map: any) => {
      const key = map?.value;
      const text = map?.text;
      if (key === undefined || key === null || text === undefined) {
        return;
      }
      options[String(key)] = { text: String(text) };
    });
    if (Object.keys(options).length) {
      mappings.push({ type: MappingType.ValueToText, options });
    }
  }

  if (Array.isArray(panel.rangeMaps) && panel.rangeMaps.length) {
    panel.rangeMaps.forEach((map: any) => {
      const from = Number(map?.from);
      const to = Number(map?.to);
      const text = map?.text;
      if (!Number.isFinite(from) || !Number.isFinite(to) || text === undefined) {
        return;
      }
      mappings.push({
        type: MappingType.RangeToText,
        options: {
          from,
          to,
          result: { text: String(text) },
        },
      });
    });
  }

  if (panel.nullText) {
    mappings.push({
      type: MappingType.SpecialValue,
      options: {
        match: SpecialValueMatch.Null,
        result: { text: String(panel.nullText) },
      },
    });
  }

  return mappings;
}
