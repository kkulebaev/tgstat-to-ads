import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().min(1),

  TELEGRAM_ADS_BOT_TOKEN: z.string().min(1),
  TELEGRAM_CHAT_ID: z.string().min(1),

  TGSTAT_TOKEN: z.string().min(1),
  TGSTAT_CHANNEL_ID: z.string().min(1),
  TGSTAT_WIDGET_URL: z.string().url(),

  CTA_URL: z.string().url(),
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(rawEnv: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(rawEnv);
}
