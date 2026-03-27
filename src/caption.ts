const htmlEscapeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => htmlEscapeMap[ch] ?? ch);
}

function formatDateRu(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

type Metrics = {
  channelTitle: string;
  reportDate: Date;

  subscribers: number;
  subscribersDeltaWeek: number | null;
  subscribersDeltaMonth: number | null;

  avgPostReach: number | null;
  err: number | null;
  err24: number | null;

  adViews24: number | null;
  adViews48: number | null;

  citationIndex: number | null;
  citingChannels: number | null;
  mentions: number | null;
  reposts: number | null;

  channelAgeMonths: number | null;
};

function n(nv: number | null): string {
  return nv === null ? '—' : new Intl.NumberFormat('ru-RU').format(nv);
}

function p(pv: number | null): string {
  return pv === null ? '—' : `${pv}`;
}

export function buildCaptionHtml(m: Metrics): string {
  const title = escapeHtml(m.channelTitle);
  const date = formatDateRu(m.reportDate);

  return [
    `1. 📊 Статистика Telegram-канала ${title} (${date})`,
    '',
    'Канал уверенно растёт и показывает стабильные рекламные показатели в нише 18+ с живой, вовлечённой аудиторией.',
    '',
    `🔹 Подписчики: ${n(m.subscribers)}`,
    `— +${m.subscribersDeltaWeek === null ? '—' : n(m.subscribersDeltaWeek)} за неделю`,
    `— +${m.subscribersDeltaMonth === null ? '—' : n(m.subscribersDeltaMonth)} за месяц`,
    '➡️ активный приток новой аудитории, канал находится в фазе роста',
    '',
    '🔹 Охваты:',
    `— средний охват поста: ${m.avgPostReach === null ? '—' : n(m.avgPostReach)}`,
    `— ERR ${m.err === null ? '—' : `${p(m.err)}%`} — почти каждый подписчик видит контент`,
    `— ERR₍24₎ ${m.err24 === null ? '—' : `${p(m.err24)}%`} — высокий интерес в первые сутки`,
    '',
    '🔹 Рекламные показатели:',
    `— ~${m.adViews24 === null ? '—' : n(m.adViews24)} просмотр за первые 24 часа`,
    `— до ${m.adViews48 === null ? '—' : n(m.adViews48)} просмотров за 48 часов`,
    '➡️ реклама продолжает добирать охват, а не «умирает» после публикации',
    '',
    '🔹 Цитируемость и распространение:',
    `— индекс цитирования: ${m.citationIndex === null ? '—' : m.citationIndex}`,
    `— ${m.citingChannels === null ? '—' : n(m.citingChannels)} канала ссылаются на контент`,
    `— ${m.mentions === null ? '—' : n(m.mentions)} упоминания и ${m.reposts === null ? '—' : n(m.reposts)} репоста`,
    '➡️ контент активно разлетается по Telegram',
    '',
    `🔹 Возраст канала: ${m.channelAgeMonths === null ? '—' : `~${m.channelAgeMonths} месяцев`}`,
    '➡️ молодая аудитория без выгорания и рекламной слепоты',
  ].join('\n');
}

export type { Metrics };
