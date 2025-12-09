# Single Stat Math Panel

This panel is a modification of the native single stat panel to support math functions across series.  
As of v2 the plugin is implemented in React and compiled with the Grafana plugin tools, making it compatible with Grafana 12+.

## Development

1. Install dependencies with `npm install`.
2. Start a dev build with `npm run dev` (watches and rebuilds on change).
3. Generate a production bundle with `npm run build`.
4. Run `npm run test` to execute the Jest test suite (if/when tests are added).

Use the standard Grafana field options (thresholds, units, value mappings) to control the state/formatting of the computed value.

### Usage

### InfluxDB

To use the math feature, give the series an alias by name and use that name inside the math field as variables. 

![Image of using InfluxDB metric](https://raw.github.com/black-mirror-1/singlestat-math/master/src/img/readme/influx_metric.png)

In the math field you can use the alias names to perform math across series.

![Image of using math field](https://raw.github.com/black-mirror-1/singlestat-math/master/src/img/readme/math_field.png)

## Changelog

## 2.0.0
* Migrated the panel to the Grafana React plugin platform (compatible with Grafana 12).
* Replaced the Angular controller with a React renderer, new sparkline/gauge implementations, and math execution backed by `mathjs`.
* Moved thresholds and value mappings to the standard Grafana field configuration.

## 1.1.7
* Merged [PR](https://github.com/black-mirror-1/singlestat-math/pull/29) to add new threshold model and new tooltip 

## 1.1.6
* Merged [PR](https://github.com/black-mirror-1/singlestat-math/pull/17) to fix gauge color

## 1.1.5
* Merged [PR](https://github.com/black-mirror-1/singlestat-math/pull/12) to autoupdate panels with previous threshold format.

## 1.1.4
* Merged [PR](https://github.com/black-mirror-1/singlestat-math/pull/9) to add granular threshold options.

## 1.1.3
* Merged [PR](https://github.com/black-mirror-1/singlestat-math/pull/6) to add circle shape as background option.

## 1.1.2
* Merged [PR](https://github.com/black-mirror-1/singlestat-math/pull/5) to remove importing own flot plugins.

## 1.1.1
* Changed function evaluation error handling to set results to zero

## 1.1.0
* Fixed missing flot library crashing graph panel.
* Updated dependencies.

## 1.0.0

* Added math options if multiple queries are used.
* Math field will use series alias name to evaluate function. 
