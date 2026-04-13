import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import type {
  Config,
  ConfigFile,
  Exercise,
  Workout,
  WorkoutSummary,
} from '../types';
import { ConfigSchema } from '../zod';
import { FileReaderService } from './file-reader.service';
import { LiveDataService } from './live-data.service';

@Injectable()
export class SHealthService {
  private exercisesDir = path.join('jsons', 'com.samsung.shealth.exercise');

  constructor(
    private readonly liveDataSvc: LiveDataService,
    private readonly fileReaderSvc: FileReaderService,
  ) {}

  /**
   * @param inputDir      The directory path of the samsung health export
   * @param outputDir     The output directory
   * @param config        The configuration of the export
   */
  async run(inputDir: string, outputDir: string, config: Config) {
    const data = await this.loadExercises(inputDir, config);

    await fs.mkdir(outputDir, { recursive: true });

    const filePath = path.join(outputDir, 'workouts.json');
    const compressedFilePath = path.join(outputDir, 'workout_summaries.json');

    const workouts: ReadonlyArray<Exercise> = data;
    const workoutSummaries: ReadonlyArray<WorkoutSummary> = data.map(
      (d) => d.workoutSummary,
    );

    await fs.writeFile(filePath, JSON.stringify(workouts, null, 2), {
      encoding: 'utf-8',
    });
    console.log(`${filePath} generated`);

    await fs.writeFile(
      compressedFilePath,
      JSON.stringify(workoutSummaries, null, 2),
      { encoding: 'utf-8' },
    );
    console.log(`${compressedFilePath} generated`);
  }

  private async loadExercises(
    dir: string,
    config: Config,
  ): Promise<ReadonlyArray<Exercise>> {
    const exercises: Record<string, Exercise> = {};
    const rootDir = path.join(dir, this.exercisesDir);

    const allData = await this.fileReaderSvc.findExerciseCSV<Workout>(
      dir,
      config.lastExercises,
      config.exerciseTypes.length
        ? (v) =>
            config.exerciseTypes.includes(
              v['com.samsung.health.exercise.exercise_type'],
            )
        : undefined,
    );

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

      if (!stats.isDirectory()) {
        continue;
      }

      const files = await fs.readdir(fullPath);
      for (const file of files) {
        const id = file.substring(0, 36);
        if (!exercises[id]) {
          continue;
        }

        const typ = file.substring(37) as keyof Exercise;

        const filePath = path.join(fullPath, file);
        const stat = await fs.stat(filePath);
        if (stat.isFile()) {
          exercises[id][typ] = await this.fileReaderSvc.readJSON(filePath);
        }
      }
    }

    Object.keys(exercises).forEach((id) => {
      exercises[id].workoutSummary = this.getWorkoutSummary(
        exercises[id],
        config,
      );
    });

    return Object.values(exercises).sort(
      (d1, d2) =>
        toTimestamp(d1.workout['com.samsung.health.exercise.start_time']) -
        toTimestamp(d2.workout['com.samsung.health.exercise.start_time']),
    );
  }

  private getWorkoutSummary(exercise: Exercise, conf: Config): WorkoutSummary {
    return {
      start_time: exercise.workout['com.samsung.health.exercise.start_time'],
      end_time: exercise.workout['com.samsung.health.exercise.end_time'],
      duration: Number(
        exercise.workout['com.samsung.health.exercise.duration'],
      ),
      distance: Number(
        exercise.workout['com.samsung.health.exercise.distance'],
      ),
      calories: Number(exercise.workout.total_calorie),
      mean_hr: Number(
        exercise.workout['com.samsung.health.exercise.mean_heart_rate'],
      ),
      max_hr: Number(
        exercise.workout['com.samsung.health.exercise.max_heart_rate'],
      ),
      min_hr: Number(
        exercise.workout['com.samsung.health.exercise.min_heart_rate'],
      ),
      mean_speed: Number(
        exercise.workout['com.samsung.health.exercise.mean_speed'],
      ),
      max_speed: Number(
        exercise.workout['com.samsung.health.exercise.max_speed'],
      ),
      mean_cadence: Number(
        exercise.workout['com.samsung.health.exercise.mean_cadence'],
      ),
      max_cadence: Number(
        exercise.workout['com.samsung.health.exercise.max_cadence'],
      ),
      altitude_gain: Number(
        exercise.workout['com.samsung.health.exercise.altitude_gain'],
      ),
      altitude_loss: Number(
        exercise.workout['com.samsung.health.exercise.altitude_loss'],
      ),
      vo2_max: Number(exercise.workout['com.samsung.health.exercise.vo2_max']),
      sweat_loss: Number(
        exercise.workout['com.samsung.health.exercise.sweat_loss'],
      ),
      live_data: this.liveDataSvc.get(exercise, conf),
    };
  }

  async getConfig(
    path: string | undefined,
    lastExercises: number | undefined,
  ): Promise<Config> {
    const defaultConfig = {
      liveData: this.liveDataSvc.getDefaultConfig(),
      lastExercises: -1,
      exerciseTypes: [],
    } as const satisfies Config;

    let configFileRaw: ConfigFile | undefined;

    if (path) {
      configFileRaw = await this.fileReaderSvc.readYAML<ConfigFile>(path);
    }

    if (!configFileRaw) {
      return {
        ...defaultConfig,
        lastExercises: lastExercises ?? defaultConfig.lastExercises,
      };
    }

    const result = ConfigSchema.safeParse(configFileRaw);
    if (!result.success) {
      console.error('Invalid config file:');
      console.error(z.treeifyError(result.error));
      throw result.error;
    }

    return {
      ...defaultConfig,
      liveData: {
        ...defaultConfig.liveData,
        ...(result.data.liveData || {}),
        aggregationStrategy: {
          ...defaultConfig.liveData.aggregationStrategy,
          ...result.data.liveData?.aggregationStrategy,
        },
      },
      lastExercises:
        lastExercises ??
        result.data.lastExercises ??
        defaultConfig.lastExercises,
      exerciseTypes: result.data.exerciseTypes ?? defaultConfig.exerciseTypes,
    };
  }
}

const toTimestamp = (s: string) => new Date(s.replace(' ', 'T')).getTime();
