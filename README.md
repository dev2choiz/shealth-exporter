# Samsung Health CLI Parser

This project is a CLI tool that parses Samsung Health exports and generates JSON files containing exercises data and compressed data.

## Installation

Clone the repository:

```
git clone https://github.com/dev2choiz/shealth-exporter.git
cd shealth-exporter
```

Install dependencies:

```
npm install
```

Run the CLI:

```
npx ts-node src/cli.ts shealth-exporter --input=<samsung health export path> --output=./data
```

or

```
node \
    node_modules/ts-node/dist/bin.js \
    src/cli.ts \
    shealth-exporter \
    --input=<samsung health export path> \
    --output=./data
```

The CLI accepts an optional `--config-file` argument that points to a YAML configuration file.

Configuration file format:

```yaml
lastExercises: 10
exerciseTypes: [] # possible values: https://developer.samsung.com/health/android/data/api-reference/EXERCISE_TYPE.html
liveData:
  intervalHeartRate: 5000 # min: 1000
  intervalRun: 5000 # min: 5000
  intervalLocation: 10000 # min: 1000
  intervalVo2max: 30000 # min: 5000
  intervalDistance: 30000
  exportFields:
    - "start_time"
    - "heart_rate"
    - "cadence"
    - "speed"
  aggregationStrategy:
    heart_rate: "mean"
    cadence: "mean"
    speed: "mean"
    distance: "last"
    calorie: "last"
    percent_of_vo2max: "mean"
    altitude: "mean"
    latitude: "mean"
    longitude: "mean"
    accuracy: "mean"
```
