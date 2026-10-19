import { z } from 'zod';

export const dependencyStatusSchema = z.object({
  status: z.enum(['up', 'down']),
  latencyMs: z.number().int().nonnegative().optional(),
  error: z.string().optional(),
});

export const livenessSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
  version: z.string(),
  timestamp: z.string(),
  uptimeSeconds: z.number().nonnegative(),
});

export const readinessSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  timestamp: z.string(),
  checks: z.object({
    database: dependencyStatusSchema,
    redis: dependencyStatusSchema,
  }),
});

export type Liveness = z.infer<typeof livenessSchema>;
export type Readiness = z.infer<typeof readinessSchema>;
