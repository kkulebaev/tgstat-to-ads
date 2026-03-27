import type pg from 'pg';
import { loadState, saveState } from './db.js';
import { withAdvisoryLock } from './lock.js';
import { fetchTgStat } from './tgstat.js';
import { parseTgStatEnvelope } from './tgstat.types.js';
import { buildCaptionHtml, type Metrics } from './caption.js';
import { deleteMessage, sendPhotoFromUrl } from './telegram.js';

function pickMetrics(params: {
  envelope: unknown;
  channelTitleFallback: string;
  reportDate: Date;
}): Metrics {
  const parsed = parseTgStatEnvelope(params.envelope);
  const r = parsed.response;

  const channelTitle = r.title?.trim() ? r.title : params.channelTitleFallback;

  return {
    channelTitle,
    reportDate: params.reportDate,

    subscribers: r.participants_count,
    subscribersDeltaWeek: null,
    subscribersDeltaMonth: null,

    avgPostReach: r.avg_post_reach ?? null,
    err: r.err_percent ?? null,
    err24: r.err24_percent ?? null,

    adViews24: r.adv_post_reach_24h ?? null,
    adViews48: r.adv_post_reach_48h ?? null,

    citationIndex: r.ci_index ?? null,
    citingChannels: r.mentioning_channels_count ?? null,
    mentions: r.mentions_count ?? null,
    reposts: r.forwards_count ?? null,

    channelAgeMonths: null,
  };
}

export async function runJob(params: {
  pool: pg.Pool;
  stateKey: string;
  telegramToken: string;
  telegramChatId: string;
  tgstatToken: string;
  tgstatChannelId: string;
  tgstatWidgetUrl: string;
  ctaUrl: string;
  tgStatMock: boolean;
}): Promise<{ photoMessageId: number }>{
  return await withAdvisoryLock({
    pool: params.pool,
    key: `tgstat-to-ads:${params.stateKey}`,
    fn: async () => {
      const state = await loadState(params.pool, params.stateKey);

  if (state.photo_message_id) {
    try {
      await deleteMessage({
        token: params.telegramToken,
        chatId: params.telegramChatId,
        messageId: state.photo_message_id,
      });
    } catch {
      // ignore
    }
  }

  const tg = params.tgStatMock
    ? {
        status: 'ok',
        response: {
          id: 0,
          title: 'Nude Vision',
          username: '@nude_vision',
          participants_count: 1805,
          avg_post_reach: 1687,
          adv_post_reach_24h: 401,
          adv_post_reach_48h: 579,
          err_percent: 93.5,
          err24_percent: 24,
          ci_index: 7.0,
          mentioning_channels_count: 23,
          mentions_count: 42,
          forwards_count: 22,
        },
      }
    : await fetchTgStat({ token: params.tgstatToken, channelId: params.tgstatChannelId });

  const reportDate = new Date();

  const metrics = pickMetrics({
    envelope: tg,
    channelTitleFallback: 'Nude Vision',
    reportDate,
  });

  const caption = [
    buildCaptionHtml(metrics),
    '',
    '<i>Нажмите кнопку ниже, чтобы написать по размещению рекламы</i>',
  ].join('\n');

  const photoMsg = await sendPhotoFromUrl({
    token: params.telegramToken,
    chatId: params.telegramChatId,
    photoUrl: params.tgstatWidgetUrl,
    caption,
    parseMode: 'HTML',
    replyMarkup: {
      inline_keyboard: [[{ text: 'Размещение рекламы', url: params.ctaUrl }]],
    },
  });

      await saveState(params.pool, {
        key: params.stateKey,
        photo_message_id: photoMsg.message_id,
      });

      return { photoMessageId: photoMsg.message_id };
    },
  });
}
