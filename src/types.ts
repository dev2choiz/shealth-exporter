import type { z } from 'zod';
import type { aggregationStrategy, exerciseTypes } from './constants';
import type { ConfigSchema } from './zod';

type MergeUnion<T> = {
  [K in T extends unknown ? keyof T : never]: T extends Record<K, infer V>
    ? V
    : never;
};

type WithRequired<T, K extends keyof T> = T & {
  [F in K]-?: T[F];
};

export type AssertTrue<T extends true> = T;

export type TypesEqual<T, U> = [T] extends [U]
  ? [U] extends [T]
    ? true
    : false
  : false;

type SensingStatus = {
  advanced_metrics: {
    is_valid: boolean;
  };
  heart_rate: {
    is_valid: boolean;
    type: number;
    max_hr_custom: number;
    max_hr_auto: number;
    at: number;
    ant: number;
    rhr: number;
  };
  heart_rate_zone: {
    is_valid: false;
  };
  location_finetuned: boolean;
  max_hr: {
    is_valid: boolean;
    is_updated: boolean;
  };
  percent_of_vo2_max: {
    is_valid: boolean;
    prev_vo2_max: number;
    is_measured: number;
  };
  sampling_rate: number;
  sweat_loss: {
    is_valid: boolean;
  };
  vo2_max: {
    is_valid: boolean;
  };
};

type LiveData =
  | { heart_rate: number; start_time: number }
  | {
      cadence: number;
      calorie: number;
      distance: number;
      speed: number;
      start_time: number;
    }
  | {
      percent_of_vo2max: number;
      start_time: number;
    }
  | {
      distance: number;
      start_time: number;
    };

type LocationData = {
  accuracy: number;
  altitude: number;
  latitude: number;
  longitude: number;
  start_time: number;
};

type DataInternal = {
  elapsed_time: number;
  interval: number;
  segment: number;
  start_time: number;
};

type LocationDataInternal = {
  elapsed_time: number;
  interval: number;
  segment: number;
  start_time: number;
};

type AdditionalInternal = Record<string, unknown>;

export type Workout = {
  live_data_internal: string;
  mission_value: string;
  race_target: string;
  subset_data: string;
  start_longitude: string;
  routine_datauuid: string;
  total_calorie: string;
  completion_status: string;
  pace_info_id: string;
  activity_type: string;
  pace_live_data: string;
  sensing_status: string;
  source_type: string;
  mission_type: string;
  ftp: string;
  tracking_status: string;
  program_id: string;
  title: string;
  reward_status: string;
  heart_rate_sample_count: string;
  start_latitude: string;
  mission_extra_value: string;
  program_schedule_id: string;
  heart_rate_deviceuuid: string;
  location_data_internal: string;
  custom_id: string;
  additional_internal: string;
  'com.samsung.health.exercise.duration': string;
  'com.samsung.health.exercise.additional': string;
  'com.samsung.health.exercise.create_sh_ver': string;
  'com.samsung.health.exercise.mean_caloricburn_rate': string;
  'com.samsung.health.exercise.location_data': string;
  'com.samsung.health.exercise.start_time': string;
  'com.samsung.health.exercise.exercise_type': (typeof exerciseTypes)[number];
  'com.samsung.health.exercise.custom': string;
  'com.samsung.health.exercise.max_altitude': string;
  'com.samsung.health.exercise.incline_distance': string;
  'com.samsung.health.exercise.mean_heart_rate': string;
  'com.samsung.health.exercise.count_type': string;
  'com.samsung.health.exercise.mean_rpm': string;
  'com.samsung.health.exercise.min_altitude': string;
  'com.samsung.health.exercise.modify_sh_ver': string;
  'com.samsung.health.exercise.max_heart_rate': string;
  'com.samsung.health.exercise.update_time': string;
  'com.samsung.health.exercise.create_time': string;
  'com.samsung.health.exercise.client_data_id': string;
  'com.samsung.health.exercise.max_power': string;
  'com.samsung.health.exercise.max_speed': string;
  'com.samsung.health.exercise.mean_cadence': string;
  'com.samsung.health.exercise.min_heart_rate': string;
  'com.samsung.health.exercise.client_data_ver': string;
  'com.samsung.health.exercise.count': string;
  'com.samsung.health.exercise.distance': string;
  'com.samsung.health.exercise.max_caloricburn_rate': string;
  'com.samsung.health.exercise.calorie': string;
  'com.samsung.health.exercise.max_cadence': string;
  'com.samsung.health.exercise.decline_distance': string;
  'com.samsung.health.exercise.vo2_max': string;
  'com.samsung.health.exercise.time_offset': string;
  'com.samsung.health.exercise.deviceuuid': string;
  'com.samsung.health.exercise.max_rpm': string;
  'com.samsung.health.exercise.comment': string;
  'com.samsung.health.exercise.live_data': string;
  'com.samsung.health.exercise.mean_power': string;
  'com.samsung.health.exercise.mean_speed': string;
  'com.samsung.health.exercise.pkg_name': string;
  'com.samsung.health.exercise.altitude_gain': string;
  'com.samsung.health.exercise.altitude_loss': string;
  'com.samsung.health.exercise.exercise_custom_type': string;
  'com.samsung.health.exercise.auxiliary_devices': string;
  'com.samsung.health.exercise.end_time': string;
  'com.samsung.health.exercise.datauuid': string;
  'com.samsung.health.exercise.sweat_loss': string;
};

export type Exercise = {
  uuid: string;
  start_time: string;
  workout: Workout;
  workoutSummary: WorkoutSummary;
  'additional_internal.json': Array<AdditionalInternal>;
  'com.samsung.health.exercise.live_data.json': Array<LiveData>;
  'com.samsung.health.exercise.location_data.json': Array<LocationData>;
  'live_data_internal.json': Array<DataInternal>;
  'location_data_internal.json': Array<LocationDataInternal>;
  'sensing_status.json': SensingStatus;
};

type ExportLiveData = WithRequired<
  Partial<
    Pick<
      MergeUnion<LiveData>,
      | 'cadence'
      | 'calorie'
      | 'distance'
      | 'heart_rate'
      | 'percent_of_vo2max'
      | 'speed'
      | 'start_time'
    > &
      Pick<LocationData, 'accuracy' | 'altitude' | 'latitude' | 'longitude'>
  >,
  'start_time'
>;

export type ExportField = keyof ExportLiveData;

export type WorkoutSummary = {
  start_time: string;
  end_time: string;
  duration: number;
  distance: number;
  calories: number;
  mean_hr: number;
  max_hr: number;
  min_hr: number;
  mean_speed: number;
  max_speed: number;
  mean_cadence: number;
  max_cadence: number;
  altitude_gain: number;
  altitude_loss: number;
  vo2_max: number;
  sweat_loss: number;
  live_data: string;
};

export type AggregationStrategy = (typeof aggregationStrategy)[number];

export type AggregationStrategyConfig = Record<
  Exclude<ExportField, 'start_time'>,
  AggregationStrategy
>;

type DeepRequired<T> = T extends object
  ? { [K in keyof T]-?: DeepRequired<T[K]> }
  : T;

export type ConfigFile = z.infer<typeof ConfigSchema>;

export type Config = DeepRequired<ConfigFile>;
