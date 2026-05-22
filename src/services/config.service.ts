import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import type { AggregationStrategyConfig, Config, ConfigFile } from '../types';
import { ExportField } from '../types/shealth';
import { ConfigSchema } from '../zod';
import { FileReaderService } from './file-reader.service';

const intervalHeartRate = 5_000;
const intervalRun = 10_000;
const intervalLocation = 10_000;
const intervalVo2max = 30_000;
const intervalDistance = 30_000;

const defaultExportFields = [
  'start_time',
  'heart_rate',
  'cadence',
  'speed',
] as const satisfies Array<ExportField>;

const defaultAggregation = {
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
} satisfies AggregationStrategyConfig;

const defaultLiveData: Config['liveData'] = {
  intervalHeartRate,
  intervalRun,
  intervalLocation,
  intervalVo2max,
  intervalDistance,
  exportFields: defaultExportFields,
  aggregationStrategy: defaultAggregation,
};

@Injectable()
export class ConfigService {
  constructor(private readonly fileReaderSvc: FileReaderService) {}

  async getConfig(
    path: string | undefined,
    lastExercises: number | undefined,
  ): Promise<Config> {
    const defaultConfig = {
      liveData: defaultLiveData,
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
