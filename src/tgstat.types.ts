import { z } from 'zod';

export const tgStatResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  username: z.string().optional(),

  participants_count: z.number(),
  avg_post_reach: z.number().nullable().optional(),

  adv_post_reach_12h: z.number().nullable().optional(),
  adv_post_reach_24h: z.number().nullable().optional(),
  adv_post_reach_48h: z.number().nullable().optional(),

  err_percent: z.number().nullable().optional(),
  err24_percent: z.number().nullable().optional(),

  ci_index: z.number().nullable().optional(),
  mentions_count: z.number().nullable().optional(),
  forwards_count: z.number().nullable().optional(),
  mentioning_channels_count: z.number().nullable().optional(),

  posts_count: z.number().nullable().optional(),
});

export const tgStatEnvelopeSchema = z.object({
  status: z.literal('ok'),
  response: tgStatResponseSchema,
});

export type TgStatResponse = z.infer<typeof tgStatResponseSchema>;
export type TgStatEnvelope = z.infer<typeof tgStatEnvelopeSchema>;
