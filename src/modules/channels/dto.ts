import { z } from 'zod';

export const CreateChannelDTO = z.object({
  name: z.string().min(1).max(60),
});

export const JoinByCodeDTO = z.object({
  code: z.string().min(6).max(64),
});

export type CreateChannelInput = z.infer<typeof CreateChannelDTO>;
export type JoinByCodeInput = z.infer<typeof JoinByCodeDTO>;
