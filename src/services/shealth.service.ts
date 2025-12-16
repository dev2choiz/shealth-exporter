import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import { CompressedWorkout, Exercise, ExportLiveData, Workout } from '../types';

const round = (n: number, decimal = 0) =>
  Math.round(n * 10 ** decimal) / 10 ** decimal;

const toTimestamp = (s: string) => new Date(s.replace(' ', 'T')).getTime();

const readFile = (filePath: string) =>
  fs.readFile(filePath, { encoding: 'utf-8' });

const readJSON = async <T>(filePath: string) =>
  JSON.parse(await readFile(filePath)) as T;

const readCSV = async <T extends Record<string, any> = Record<string, any>>(
  filePath: string,
  lineStart: number = 0,
) => {
  const content = await readFile(filePath);
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '');

  if (lines.length <= lineStart) return [];

  const csv = lines.slice(lineStart).join('\n');

  return parseCSVToRecords<T>(csv);
};

const parseCSVToRecords = <T extends Record<string, any> = Record<string, any>>(
  csv: string,
): ReadonlyArray<T> => {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length === 0) return [];

  const headers = lines[0].split(',');

  return lines.slice(1).map((line) => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] ?? '';
    });

    return obj as T;
  });
};

const findExerciseCSV = async (
  folderPath: string,
): Promise<ReadonlyArray<Workout>> => {
  try {
    const stats = await fs.stat(folderPath);
    if (!stats.isDirectory()) {
      throw new Error(`Path exists but is not a directory: ${folderPath}`);
    }
  } catch (err) {
    throw new Error(
      `Folder not found: ${folderPath}. Error: ${err instanceof Error ? err.message : err}`,
    );
  }

  let files: string[];
  try {
    files = await fs.readdir(folderPath);
  } catch (err) {
    throw new Error(
      `Failed to read directory ${folderPath}: ${err instanceof Error ? err.message : err}`,
    );
  }

  const csvFile = files.find(
    (file) =>
      file.startsWith('com.samsung.shealth.exercise') && file.endsWith('.csv'),
  );

  if (!csvFile) {
    throw new Error(`Exercise CSV file not found in folder: ${folderPath}`);
  }

  try {
    return await readCSV<Workout>(path.join(folderPath, csvFile), 1);
  } catch (err) {
    throw new Error(
      `Failed to read CSV file ${csvFile}: ${err instanceof Error ? err.message : err}`,
    );
  }
};

@Injectable()
export class SHealthService {
  private exercisesDir = path.join('jsons', 'com.samsung.shealth.exercise');

  /**
   * @param inputDir          The directory path of the samsung health export
   * @param outputDir         The output directory
   * @param lastExerciseOnly  Allow to export all exercises or the last exercise
   */
  async run(inputDir: string, outputDir: string, lastExerciseOnly = true) {
    const data = await this.loadExercises(inputDir);

    await fs.mkdir(outputDir, { recursive: true });

    const filePath = path.join(outputDir, 'exercises.json');
    const compressedFilePath = path.join(
      outputDir,
      'compressed_exercises.json',
    );

    let exercises: ReadonlyArray<Exercise> | Exercise = data;
    let compressedExercises:
      | ReadonlyArray<CompressedWorkout>
      | CompressedWorkout = data.map((d) => d.compressedWorkout);

    if (lastExerciseOnly) {
      exercises = exercises[exercises.length - 1];
      compressedExercises = compressedExercises[compressedExercises.length - 1];
    }

    await fs.writeFile(filePath, JSON.stringify(exercises, null, 2), {
      encoding: 'utf-8',
    });
    console.log(`${filePath} generated`);

    await fs.writeFile(
      compressedFilePath,
      JSON.stringify(compressedExercises, null, 2),
      { encoding: 'utf-8' },
    );
    console.log(`${compressedFilePath} generated`);
  }

  private async loadExercises(dir: string): Promise<ReadonlyArray<Exercise>> {
    const exercises: Record<string, Exercise> = {};
    const rootDir = path.join(dir, this.exercisesDir);

    const allData = await findExerciseCSV(dir);

    allData.forEach((data) => {
      const uuid = data['com.samsung.health.exercise.datauuid'];

      exercises[uuid] = {
        uuid,
        start_time: data['com.samsung.health.exercise.start_time'],
        workout: data,
      } as Exercise;
    });

    const entries = await fs.readdir(rootDir);

    for (const entry of entries) {
      const fullPath = path.join(rootDir, entry);
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        const files = await fs.readdir(fullPath);
        for (const file of files) {
          const id = file.substring(0, 36);
          if (!exercises[id]) {
            console.log(`${file} ignored because not linked with a workout`);
            continue;
          }

          const typ = file.substring(37) as keyof Exercise;

          const filePath = path.join(fullPath, file);
          const stat = await fs.stat(filePath);
          if (stat.isFile()) {
            exercises[id][typ] = await readJSON(filePath);
          }
        }
      }
    }

    Object.keys(exercises).forEach((id) => {
      exercises[id].compressedWorkout = {
        start_time:
          exercises[id].workout['com.samsung.health.exercise.start_time'],
        end_time: exercises[id].workout['com.samsung.health.exercise.end_time'],
        duration: Number(
          exercises[id].workout['com.samsung.health.exercise.duration'],
        ),
        distance: Number(
          exercises[id].workout['com.samsung.health.exercise.distance'],
        ),
        calories: Number(
          exercises[id].workout['com.samsung.health.exercise.calorie'],
        ),
        mean_hr: Number(
          exercises[id].workout['com.samsung.health.exercise.mean_heart_rate'],
        ),
        max_hr: Number(
          exercises[id].workout['com.samsung.health.exercise.max_heart_rate'],
        ),
        min_hr: Number(
          exercises[id].workout['com.samsung.health.exercise.min_heart_rate'],
        ),
        mean_speed: Number(
          exercises[id].workout['com.samsung.health.exercise.mean_speed'],
        ),
        max_speed: Number(
          exercises[id].workout['com.samsung.health.exercise.max_speed'],
        ),
        mean_cadence: Number(
          exercises[id].workout['com.samsung.health.exercise.mean_cadence'],
        ),
        max_cadence: Number(
          exercises[id].workout['com.samsung.health.exercise.max_cadence'],
        ),
        altitude_gain: Number(
          exercises[id].workout['com.samsung.health.exercise.altitude_gain'],
        ),
        altitude_loss: Number(
          exercises[id].workout['com.samsung.health.exercise.altitude_loss'],
        ),
        live_data: getLiveDataCSV(exercises[id]),
      };
    });

    return Object.values(exercises).sort(
      (d1, d2) =>
        toTimestamp(d1.workout['com.samsung.health.exercise.start_time']) -
        toTimestamp(d2.workout['com.samsung.health.exercise.start_time']),
    );
  }
}

const INTERVAL_HR = 5_000;
const INTERVAL_RUN = 10_000;
const INTERVAL_LOC = 10_000;
const INTERVAL_VO2MAX = 30_000;
const INTERVAL_DISTANCE = 30_000;

const bucketTime = (t: number, interval: number): number =>
  Math.floor(t / interval) * interval;

type ExportField = keyof ExportLiveData;

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

function getLiveDataCSV(
  data: Exercise,
  fields: ExportField[] = ['start_time', 'heart_rate', 'cadence', 'speed'],
  aggregation: Partial<Record<ExportField, AggregationStrategy>> = {},
): string {
  const liveData = data['com.samsung.health.exercise.live_data.json'] || [];
  const locData = data['com.samsung.health.exercise.location_data.json'] || [];

  const aggConfig: Partial<Record<ExportField, AggregationStrategy>> = {
    ...defaultAggregation,
    ...aggregation,
  };

  const buckets = new Map<number, BucketAgg>();

  const getBucket = (t: number): BucketAgg => {
    const existing = buckets.get(t);
    if (existing) {
      return existing;
    }

    const created: BucketAgg = { start_time: t, fields: {} };
    buckets.set(t, created);

    return created;
  };

  liveData.forEach((d) => {
    if ('heart_rate' in d) {
      const t = bucketTime(d.start_time, INTERVAL_HR);
      const b = getBucket(t);
      pushAggValue(b, 'heart_rate', d.heart_rate);
    }

    if ('cadence' in d) {
      const t = bucketTime(d.start_time, INTERVAL_RUN);
      const b = getBucket(t);
      pushAggValue(b, 'cadence', d.cadence);
      pushAggValue(b, 'calorie', d.calorie);
      pushAggValue(b, 'distance', d.distance);
      pushAggValue(b, 'speed', d.speed);
    }

    if ('percent_of_vo2max' in d) {
      const t = bucketTime(d.start_time, INTERVAL_VO2MAX);
      const b = getBucket(t);
      pushAggValue(b, 'percent_of_vo2max', d.percent_of_vo2max);
    }

    if ('distance' in d && !('cadence' in d)) {
      const t = bucketTime(d.start_time, INTERVAL_DISTANCE);
      const b = getBucket(t);
      pushAggValue(b, 'distance', d.distance);
    }
  });

  locData.forEach((d) => {
    const t = bucketTime(d.start_time, INTERVAL_LOC);
    const b = getBucket(t);
    pushAggValue(b, 'accuracy', d.accuracy);
    pushAggValue(b, 'altitude', d.altitude);
    pushAggValue(b, 'latitude', d.latitude);
    pushAggValue(b, 'longitude', d.longitude);
  });

  const sortedBuckets = [...buckets.values()].sort(
    (a, b) => a.start_time - b.start_time,
  );

  const lines = [fields.join(',')];

  sortedBuckets.forEach((bucket) => {
    const row = fields.map((f): number | string => {
      if (f === 'start_time') {
        return Math.round(
          (bucket.start_time - sortedBuckets[0].start_time) / 1000,
        );
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
}
