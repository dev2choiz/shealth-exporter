import { z } from 'zod';
import { aggregationStrategy, exportFieldArray } from './constants';

export const ConfigSchema = z
  .object({
    lastExercises: z
      .number()
      .int()
      .refine((v) => v === -1 || v >= 1)
      .optional(),

    liveData: z
      .object({
        intervalHeartRate: z.number().min(1000).optional(),
        intervalRun: z.number().min(5000).optional(),
        intervalLocation: z.number().min(1000).optional(),
        intervalVo2max: z.number().min(5000).optional(),
        intervalDistance: z.number().min(5000).optional(),
        exportFields: z.array(z.enum(exportFieldArray)).optional(),
        aggregationStrategy: z
          .record(
            z.enum(exportFieldArray.filter((v) => v !== 'start_time')),
            z.enum(aggregationStrategy),
          )
          .optional(),
      })
      .optional(),
  })
  .strict();
