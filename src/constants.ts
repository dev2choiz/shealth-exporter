import type { AssertTrue, ExportField, TypesEqual } from './types';

export const aggregationStrategy = [
  'first',
  'last',
  'mean',
  'min',
  'max',
] as const;

export const exportFieldArray = [
  'cadence',
  'calorie',
  'distance',
  'heart_rate',
  'percent_of_vo2max',
  'speed',
  'start_time',
  'accuracy',
  'altitude',
  'latitude',
  'longitude',
] as const satisfies readonly ExportField[];

type ExportFieldFromArray = (typeof exportFieldArray)[number];

// check if `exportFieldArray` is complete
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _CheckExportFieldsStrict = AssertTrue<
  TypesEqual<ExportFieldFromArray, ExportField>
>;
