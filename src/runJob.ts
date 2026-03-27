import type pg from 'pg';
import { loadState, saveState } from './db.js';
import { withAdvisoryLock } from './lock.js';
import { fetchTgStat } from './tgstat.js';
import { buildCaptionHtml, type Metrics } from './caption.js';
import { deleteMessage, sendMessage, sendPhotoFromUrl } from './telegram.js';

function asNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return null;
}

function pickMetrics(params: {
  envelope: unknown;
  channelTitleFallback: string;
  reportDate: Date;
}): Metrics {
  // TGStat response shape can vary; we treat it as unknown and cherry-pick common fields.
  const env = params.envelope as { response?: unknown };
  const r = (env.response ?? {}) as Record<string, unknown>;

  const channelTitle =
    (typeof r.title === 'string' && r.title.trim() !== '' ? r.title : null) ??
    params.channelTitleFallback;

  return {
    channelTitle,
    reportDate: params.reportDate,

    subscribers: asNumber(r.participants_count) ?? asNumber(r.subscribers) ?? 0,
    subscribersDeltaWeek: asNumber(r.participants_delta_week) ?? asNumber(r.subscribers_delta_week),
    subscribersDeltaMonth: asNumber(r.participants_delta_month) ?? asNumber(r.subscribers_delta_month),

    avgPostReach: asNumber(r.avg_post_reach) ?? asNumber(r.avg_reach),
    err: asNumber(r.err),
    err24: asNumber(r.err24) ?? asNumber(r.err_24),

    adViews24: asNumber(r.ads_views_24) ?? asNumber(r.ads24) ?? asNumber(r.ad_views_24),
    adViews48: asNumber(r.ads_views_48) ?? asNumber(r.ads48) ?? asNumber(r.ad_views_48),

    citationIndex: asNumber(r.citation_index) ?? asNumber(r.ci),
    citingChannels: asNumber(r.citing_channels) ?? asNumber(r.citingChannels),
    mentions: asNumber(r.mentions),
    reposts: asNumber(r.reposts),

    channelAgeMonths: asNumber(r.channel_age_months) ?? asNumber(r.age_months),
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

  // Date: prefer TGStat timestamp if present; fallback to today.
  const response = (tg.response ?? {}) as Record<string, unknown>;
  const ts = response.date ?? response.timestamp ?? response.updated_at;
  const reportDate = typeof ts === 'string' || typeof ts === 'number' ? new Date(ts) : new Date();

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
