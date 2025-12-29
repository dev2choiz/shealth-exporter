import { Exercise, ExportField } from '../types';
import { Injectable } from '@nestjs/common';

type AggregationStrategy = 'first' | 'last' | 'mean' | 'min' | 'max';

type AggState = {
  first?: number;
  last?: number;
  min?: number;
  max?: number;
  sum: number;
  count: number;
};

type BucketAgg = {
  start_time: number;
  fields: Partial<Record<ExportField, AggState>>;
};

const INTERVAL_HR = 5_000;
const INTERVAL_RUN = 10_000;
const INTERVAL_LOC = 10_000;
const INTERVAL_VO2MAX = 30_000;
const INTERVAL_DISTANCE = 30_000;

const defaultExportFields = [
  'start_time',
  'heart_rate',
  'cadence',
  'speed',
] satisfies ReadonlyArray<ExportField>;

const defaultAggregation: Record<
  Exclude<ExportField, 'start_time'>,
  AggregationStrategy
> = {
  heart_rate: 'mean',
  cadence: 'mean',
  speed: 'mean',
  distance: 'last',
  calorie: 'last',
  percent_of_vo2max: 'mean',
  altitude: 'mean',
  latitude: 'mean',
  longitude: 'mean',
  accuracy: 'mean',
};

@Injectable()
export class LiveDataService {
  get(
    data: Exercise,
    fields: ExportField[] = defaultExportFields,
    aggregation: Partial<Record<ExportField, AggregationStrategy>> = {},
  ) {
    const liveData = data['com.samsung.health.exercise.live_data.json'] || [];
    const locData =
      data['com.samsung.health.exercise.location_data.json'] || [];

    const aggConfig: Partial<Record<ExportField, AggregationStrategy>> = {
      ...defaultAggregation,
      ...aggregation,
    };

    const buckets = new Map<number, BucketAgg>();

    liveData.forEach((d) => {
      if ('heart_rate' in d) {
        const b = getBucket(buckets, d.start_time, INTERVAL_HR);
        pushAggValue(b, 'heart_rate', d.heart_rate);
      }

      if ('cadence' in d) {
        const b = getBucket(buckets, d.start_time, INTERVAL_RUN);
        pushAggValue(b, 'cadence', d.cadence);
        pushAggValue(b, 'calorie', d.calorie);
        pushAggValue(b, 'distance', d.distance);
        pushAggValue(b, 'speed', d.speed);
      }

      if ('percent_of_vo2max' in d) {
        const b = getBucket(buckets, d.start_time, INTERVAL_VO2MAX);
        pushAggValue(b, 'percent_of_vo2max', d.percent_of_vo2max);
      }

      if ('distance' in d && !('cadence' in d)) {
        const b = getBucket(buckets, d.start_time, INTERVAL_DISTANCE);
        pushAggValue(b, 'distance', d.distance);
      }
    });

    locData.forEach((d) => {
      const b = getBucket(buckets, d.start_time, INTERVAL_LOC);
      pushAggValue(b, 'accuracy', d.accuracy);
      pushAggValue(b, 'altitude', d.altitude);
      pushAggValue(b, 'latitude', d.latitude);
      pushAggValue(b, 'longitude', d.longitude);
    });

    const sortedBuckets = [...buckets.values()].sort(
      (a, b) => a.start_time - b.start_time,
    );

    return generateCsv(fields, sortedBuckets, aggConfig);
  }
}

const round = (n: number, decimal = 0) =>
  Math.round(n * 10 ** decimal) / 10 ** decimal;

const bucketTime = (t: number, interval: number): number =>
  Math.floor(t / interval) * interval;

const ensureAggState = (bucket: BucketAgg, field: ExportField): AggState => {
  const existing = bucket.fields[field];
  if (existing) return existing;

  const created: AggState = { sum: 0, count: 0 };
  bucket.fields[field] = created;

  return created;
};

const pushAggValue = (bucket: BucketAgg, field: ExportField, value: number) => {
  const s = ensureAggState(bucket, field);
  if (s.first === undefined) s.first = value;
  s.last = value;
  s.min = s.min === undefined ? value : Math.min(s.min, value);
  s.max = s.max === undefined ? value : Math.max(s.max, value);
  s.sum += value;
  s.count += 1;
};

const getAggValue = (
  state: AggState | undefined,
  strategy: AggregationStrategy,
): number | undefined => {
  if (!state || state.count === 0) return undefined;

  switch (strategy) {
    case 'first':
      return state.first;
    case 'last':
      return state.last;
    case 'min':
      return state.min;
    case 'max':
      return state.max;
    case 'mean':
      return state.sum / state.count;
    default: {
      const _exhaustiveCheck: never = strategy;
      return _exhaustiveCheck;
    }
  }
};

const getBucket = (
  buckets: Map<number, BucketAgg>,
  startTime: number,
  interval: number,
): BucketAgg => {
  const t = bucketTime(startTime, interval);
  const existing = buckets.get(t);
  if (existing) {
    return existing;
  }

  const created: BucketAgg = { start_time: t, fields: {} };
  buckets.set(t, created);

  return created;
};

const generateCsv = (
  fields: ExportField[],
  buckets: ReadonlyArray<BucketAgg>,
  aggConfig: Partial<Record<ExportField, AggregationStrategy>>,
): string => {
  const lines = [
    fields.map((f) => (f === 'start_time' ? 'time' : f)).join(','),
  ];

  buckets.forEach((bucket) => {
    const row = fields.map((f): number | string => {
      if (f === 'start_time') {
        return Math.round((bucket.start_time - buckets[0].start_time) / 1000);
      }

      const strategy: AggregationStrategy = aggConfig[f] ?? 'mean';
      const v = getAggValue(bucket.fields[f], strategy);
      if (v === undefined) {
        return '';
      }

      switch (f) {
        case 'accuracy':
        case 'cadence':
        case 'calorie':
        case 'heart_rate':
          return round(v);
        case 'percent_of_vo2max':
          return round(v, 1);
        case 'altitude':
        case 'distance':
        case 'latitude':
        case 'longitude':
        case 'speed':
          return round(v, 2);
        default: {
          const _exhaustiveCheck: never = f;
          return _exhaustiveCheck;
        }
      }
    });

    lines.push(row.join(','));
  });

  return lines.join('\n');
};
