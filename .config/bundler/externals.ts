import type { Configuration, ExternalItemFunctionData } from 'webpack';

type ExternalsType = Configuration['externals'];

export const externals: ExternalsType = [
  { 'amd-module': 'module' },
  'lodash',
  'jquery',
  'moment',
  'slate',
  'emotion',
  '@emotion/react',
  '@emotion/css',
  'prismjs',
  'slate-plain-serializer',
  '@grafana/slate-react',
  'react',
  'react-dom',
  'react-redux',
  'redux',
  'rxjs',
  'i18next',
  'react-router',
  'react-router-dom',
  'd3',
  'angular',
  /^@grafana\/ui/i,
  /^@grafana\/runtime/i,
  /^@grafana\/data/i,
  'react-inlinesvg',
  ({ request }: ExternalItemFunctionData, callback: (error?: Error, result?: string) => void) => {
    const prefix = 'grafana/';
    const hasPrefix = (value: string) => value.indexOf(prefix) === 0;
    const stripPrefix = (value: string) => value.slice(prefix.length);

    if (request && hasPrefix(request)) {
      return callback(undefined, stripPrefix(request));
    }

    callback();
  },
];
