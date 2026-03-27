import { z } from 'zod';

const tgStatSchema = z.object({
  status: z.string().optional(),
  error: z.unknown().optional(),
  message: z.unknown().optional(),
  response: z.unknown().optional(),
});

export type TgStatEnvelope = z.infer<typeof tgStatSchema>;

export async function fetchTgStat(params: {
  token: string;
  channelId: string;
}): Promise<TgStatEnvelope> {
  const url = new URL('https://api.tgstat.ru/channels/stat');
  url.searchParams.set('token', params.token);
  url.searchParams.set('channelId', params.channelId);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TGStat HTTP error: ${res.status}`);
  }

  const json: unknown = await res.json();
  const parsed = tgStatSchema.parse(json);

  if (parsed.status && parsed.status !== 'ok') {
    const details = parsed.error ?? parsed.message ?? 'n/a';
    throw new Error(`TGStat error: status=${parsed.status}; details=${String(details)}`);
  }

  return parsed;
}
