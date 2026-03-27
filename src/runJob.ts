import type pg from 'pg';
import { loadState, saveState } from './db.js';
import { withAdvisoryLock } from './lock.js';
import { fetchTgStat } from './tgstat.js';
import { parseTgStatEnvelope } from './tgstat.types.js';
import { buildCaptionHtml, type Metrics } from './caption.js';
import { deleteMessage, sendMessage, sendPhotoFromUrl } from './telegram.js';

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
}): Promise<{ photoMessageId: number; ctaMessageId: number }>{
  return await withAdvisoryLock({
    pool: params.pool,
    key: `tgstat-to-ads:${params.stateKey}`,
    fn: async () => {
      const state = await loadState(params.pool, params.stateKey);

  const toDelete = [
    state.photo_message_id ? { kind: 'photo' as const, id: state.photo_message_id } : null,
    state.cta_message_id ? { kind: 'cta' as const, id: state.cta_message_id } : null,
  ].filter((x): x is { kind: 'photo' | 'cta'; id: number } => x !== null);

  for (const msg of toDelete) {
    try {
      await deleteMessage({
        token: params.telegramToken,
        chatId: params.telegramChatId,
        messageId: msg.id,
      });
    } catch {
      // ignore
    }
  }

  const tg = await fetchTgStat({ token: params.tgstatToken, channelId: params.tgstatChannelId });

  const reportDate = new Date();

  const metrics = pickMetrics({
    envelope: tg,
    channelTitleFallback: 'Nude Vision',
    reportDate,
  });

  const caption = buildCaptionHtml(metrics);

  const photoMsg = await sendPhotoFromUrl({
    token: params.telegramToken,
    chatId: params.telegramChatId,
    photoUrl: params.tgstatWidgetUrl,
    caption,
    parseMode: 'HTML',
  });

  const ctaMsg = await sendMessage({
    token: params.telegramToken,
    chatId: params.telegramChatId,
    text: 'Нажмите кнопку ниже, чтобы написать по размещению рекламы',
    replyMarkup: {
      inline_keyboard: [[{ text: 'Размещение рекламы', url: params.ctaUrl }]],
    },
  });

      await saveState(params.pool, {
        key: params.stateKey,
        photo_message_id: photoMsg.message_id,
        cta_message_id: ctaMsg.message_id,
      });

      return { photoMessageId: photoMsg.message_id, ctaMessageId: ctaMsg.message_id };
    },
  });
}
