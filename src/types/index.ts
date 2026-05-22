import type { z } from 'zod';
import type { aggregationStrategy } from '../constants';
import type { ConfigSchema } from '../zod';
import { ExportField } from './shealth';

export type MergeUnion<T> = {
  [K in T extends unknown ? keyof T : never]: T extends Record<K, infer V>
    ? V
    : never;
};

export type WithRequired<T, K extends keyof T> = T & {
  [F in K]-?: T[F];
};

export type AssertTrue<T extends true> = T;

export type TypesEqual<T, U> = [T] extends [U]
  ? [U] extends [T]
    ? true
    : false
  : false;

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
