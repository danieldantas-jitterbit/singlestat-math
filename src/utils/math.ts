import { evaluate } from 'mathjs';
import { ValueName } from '../types';
import { ProcessedSeries } from './series';

export function evaluateMathExpression(expression: string, series: ProcessedSeries[], valueName: ValueName): number | null {
  if (!expression.trim()) {
    return null;
  }

  let fn = expression;
  for (const item of series) {
    const value = getStatValue(item, valueName);
    const replacement = value === null || value === undefined ? '0' : String(value);
    const escapedAlias = escapeRegex(item.alias);
    if (!escapedAlias) {
      continue;
    }
    const matcher = new RegExp(escapedAlias, 'gi');
    fn = fn.replace(matcher, replacement);
  }

  fn = fn.replace(/[A-Za-z]+/g, '0');

  try {
    const result = evaluate(fn);
    if (typeof result === 'number' && Number.isFinite(result)) {
      return result;
    }
    return null;
  } catch (err) {
    return null;
  }
}

function escapeRegex(value: string) {
  return value ? value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
}

function getStatValue(series: ProcessedSeries, valueName: ValueName) {
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
