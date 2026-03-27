export type TgStatResponse = {
  id: number;
  title: string;
  username?: string;

  participants_count: number;
  avg_post_reach?: number | null;

  adv_post_reach_12h?: number | null;
  adv_post_reach_24h?: number | null;
  adv_post_reach_48h?: number | null;

  err_percent?: number | null;
  err24_percent?: number | null;

  ci_index?: number | null;
  mentions_count?: number | null;
  forwards_count?: number | null;
  mentioning_channels_count?: number | null;

  posts_count?: number | null;
};

export type TgStatEnvelope = {
  status: 'ok';
  response: TgStatResponse;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function optionalNumber(v: unknown): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (isNumber(v)) return v;
  return undefined;
}

export function parseTgStatEnvelope(input: unknown): TgStatEnvelope {
  if (!isRecord(input)) {
    throw new Error('TGStat: invalid JSON');
  }
  if (input.status !== 'ok') {
    throw new Error('TGStat: status not ok');
  }
  const response = input.response;
  if (!isRecord(response)) {
    throw new Error('TGStat: invalid response');
  }

  const id = response.id;
  const title = response.title;
  const participants = response.participants_count;

  if (!isNumber(id)) throw new Error('TGStat: invalid response.id');
  if (!isString(title) || title.trim() === '') throw new Error('TGStat: invalid response.title');
  if (!isNumber(participants)) throw new Error('TGStat: invalid response.participants_count');

  return {
    status: 'ok',
    response: {
      id,
      title,
      username: isString(response.username) ? response.username : undefined,

      participants_count: participants,
      avg_post_reach: optionalNumber(response.avg_post_reach),

      adv_post_reach_12h: optionalNumber(response.adv_post_reach_12h),
      adv_post_reach_24h: optionalNumber(response.adv_post_reach_24h),
      adv_post_reach_48h: optionalNumber(response.adv_post_reach_48h),

      err_percent: optionalNumber(response.err_percent),
      err24_percent: optionalNumber(response.err24_percent),

      ci_index: optionalNumber(response.ci_index),
      mentions_count: optionalNumber(response.mentions_count),
      forwards_count: optionalNumber(response.forwards_count),
      mentioning_channels_count: optionalNumber(response.mentioning_channels_count),

      posts_count: optionalNumber(response.posts_count),
    },
  };
}
