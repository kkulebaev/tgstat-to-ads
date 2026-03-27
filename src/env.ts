type Env = {
  PORT: number;
  DATABASE_URL: string;
  TELEGRAM_ADS_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  TGSTAT_TOKEN: string;
  TGSTAT_CHANNEL_ID: string;
  TGSTAT_WIDGET_URL: string;
  CTA_URL: string;
  TG_STAT_MOCK: boolean;
};

function requireNonEmpty(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

function requireUrl(name: string, value: string | undefined): string {
  const v = requireNonEmpty(name, value);
  // eslint-disable-next-line no-new
  new URL(v);
  return v;
}

function parsePort(raw: string | undefined): number {
  if (!raw) return 3000;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error('Invalid env: PORT');
  }
  return n;
}

export function getEnv(rawEnv: NodeJS.ProcessEnv = process.env): Env {
  return {
    PORT: parsePort(rawEnv.PORT),
    DATABASE_URL: requireNonEmpty('DATABASE_URL', rawEnv.DATABASE_URL),
    TELEGRAM_ADS_BOT_TOKEN: requireNonEmpty('TELEGRAM_ADS_BOT_TOKEN', rawEnv.TELEGRAM_ADS_BOT_TOKEN),
    TELEGRAM_CHAT_ID: requireNonEmpty('TELEGRAM_CHAT_ID', rawEnv.TELEGRAM_CHAT_ID),
    TGSTAT_TOKEN: requireNonEmpty('TGSTAT_TOKEN', rawEnv.TGSTAT_TOKEN),
    TGSTAT_CHANNEL_ID: requireNonEmpty('TGSTAT_CHANNEL_ID', rawEnv.TGSTAT_CHANNEL_ID),
    TGSTAT_WIDGET_URL: requireUrl('TGSTAT_WIDGET_URL', rawEnv.TGSTAT_WIDGET_URL),
    CTA_URL: requireUrl('CTA_URL', rawEnv.CTA_URL),
    TG_STAT_MOCK: rawEnv.TG_STAT_MOCK === '1' || rawEnv.TG_STAT_MOCK === 'true',
  };
}

export type { Env };
