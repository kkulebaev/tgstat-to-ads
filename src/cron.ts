import { getEnv } from './env.js';
import { createPool, ensureSchema } from './db.js';
import { runJob } from './runJob.js';

async function main(): Promise<void> {
  const env = getEnv();
  const pool = createPool(env.DATABASE_URL);

  try {
    await ensureSchema(pool);

    const result = await runJob({
      pool,
      stateKey: 'main',
      telegramToken: env.TELEGRAM_ADS_BOT_TOKEN,
      telegramChatId: env.TELEGRAM_CHAT_ID,
      tgstatToken: env.TGSTAT_TOKEN,
      tgstatChannelId: env.TGSTAT_CHANNEL_ID,
      tgstatWidgetUrl: env.TGSTAT_WIDGET_URL,
      ctaUrl: env.CTA_URL,
      tgStatMock: env.TG_STAT_MOCK,
    });

    console.log(JSON.stringify({ ok: true, result }, null, 2));
  } finally {
    await pool.end();
  }

  // Railway Cron Job: ensure the process exits even if the event loop has open handles.
  process.exit(0);
}

main().catch((e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(JSON.stringify({ ok: false, error: msg }, null, 2));
  process.exit(1);
});
