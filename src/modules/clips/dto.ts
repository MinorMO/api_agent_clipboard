import { z } from 'zod';

export const CreateTextClipDTO = z.object({
  channelId: z.string().min(1),
  text: z.string().min(1).max(100_000), // 100k chars como límite razonable
});

export const LatestQueryDTO = z.object({
  channelId: z.string().min(1),
});

export const RangeQueryDTO = z.object({
  channelId: z.string().min(1),
  from: z.string().datetime().optional(), // ISO
  to: z.string().datetime().optional(),   // ISO
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type CreateTextClipInput = z.infer<typeof CreateTextClipDTO>;
export type LatestQueryInput = z.infer<typeof LatestQueryDTO>;
export type RangeQueryInput = z.infer<typeof RangeQueryDTO>;
