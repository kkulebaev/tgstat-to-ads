export type TgStatEnvelope = {
  status?: string;
  error?: unknown;
  message?: unknown;
  response?: unknown;
};

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
  const parsed = json as TgStatEnvelope;

  if (parsed.status && parsed.status !== 'ok') {
    const details = parsed.error ?? parsed.message ?? 'n/a';
    throw new Error(`TGStat error: status=${parsed.status}; details=${String(details)}`);
  }

  return parsed;
}
