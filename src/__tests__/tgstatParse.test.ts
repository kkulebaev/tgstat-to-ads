import { describe, expect, it } from 'vitest';
import { tgStatEnvelopeSchema } from '../tgstat.types.js';

describe('tgStatEnvelopeSchema', () => {
  it('parses documented TGStat shape', () => {
    const input = {
      status: 'ok',
      response: {
        id: 118,
        title: 'РИА Новости',
        username: '@rian_ru',
        peer_type: 'channel',
        participants_count: 2048184,
        avg_post_reach: 541540,
        adv_post_reach_12h: 475712,
        adv_post_reach_24h: 554476,
        adv_post_reach_48h: 580952,
        err_percent: 26.4,
        err24_percent: 25.2,
        er_percent: 11.11,
        daily_reach: 35496444,
        ci_index: 8737.68,
        mentions_count: 171477,
        forwards_count: 472536,
        mentioning_channels_count: 18740,
        posts_count: 53500,
      },
    };

    const parsed = tgStatEnvelopeSchema.parse(input);

    expect(parsed.status).toBe('ok');
    expect(parsed.response.participants_count).toBe(2048184);
    expect(parsed.response.adv_post_reach_24h).toBe(554476);
    expect(parsed.response.ci_index).toBe(8737.68);
  });
});
