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

function getLiveDataCSV(
  data: Exercise,
  fields: ExportField[] = ['start_time', 'heart_rate', 'cadence', 'speed'],
): string {
  const liveData = data['com.samsung.health.exercise.live_data.json'] || [];
  const locData = data['com.samsung.health.exercise.location_data.json'] || [];

  const buckets = new Map<number, ExportLiveData>();

  liveData.forEach((d) => {
    if ('heart_rate' in d) {
      const t = bucketTime(d.start_time, INTERVAL_HR);
      const b = buckets.get(t) ?? { start_time: t };
      b.heart_rate = d.heart_rate;
      buckets.set(t, b);
    }

    if ('cadence' in d) {
      const t = bucketTime(d.start_time, INTERVAL_RUN);
      const b = buckets.get(t) ?? { start_time: t };
      b.cadence = d.cadence;
      b.calorie = d.calorie;
      b.distance = d.distance;
      b.speed = d.speed;
      buckets.set(t, b);
    }

    if ('percent_of_vo2max' in d) {
      const t = bucketTime(d.start_time, INTERVAL_VO2MAX);
      const b = buckets.get(t) ?? { start_time: t };
      b.percent_of_vo2max = d.percent_of_vo2max;
      buckets.set(t, b);
    }

    if ('distance' in d && !('cadence' in d)) {
      const t = bucketTime(d.start_time, INTERVAL_DISTANCE);
      const b = buckets.get(t) ?? { start_time: t };
      b.distance = d.distance;
      buckets.set(t, b);
    }
  });

  locData.forEach((d) => {
    const t = bucketTime(d.start_time, INTERVAL_LOC);
    const b = buckets.get(t) ?? { start_time: t };
    b.accuracy = d.accuracy;
    b.altitude = d.altitude;
    b.latitude = d.latitude;
    b.longitude = d.longitude;
    buckets.set(t, b);
  });

  const sortedData = [...buckets.values()].sort(
    (a, b) => a.start_time - b.start_time,
  );

  const lines = [fields.join(',')];

  sortedData.forEach((d) => {
    const row = fields.map((f): number | string => {
      const v = d[f];
      if (v === undefined) {
        return '';
      }

      switch (f) {
        case 'start_time':
          return Math.round((v - sortedData[0].start_time) / 1000);
        case 'altitude':
        case 'latitude':
        case 'longitude':
          return round(v, 2);
        case 'heart_rate':
          return v;
        case 'cadence':
          return round(v);
        case 'speed':
          return round(v, 2);
        case 'percent_of_vo2max':
          return round(v, 1);
        case 'distance':
          return round(v, 2);
        case 'calorie':
        case 'accuracy':
          return v;
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
