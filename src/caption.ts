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

function pluralRu(value: number, forms: { one: string; few: string; many: string }): string {
  const nAbs = Math.abs(value);
  const lastTwo = nAbs % 100;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return forms.many;
  }

  const last = nAbs % 10;

  if (last === 1) {
    return forms.one;
  }

  if (last >= 2 && last <= 4) {
    return forms.few;
  }

  return forms.many;
}

export function buildCaptionHtml(m: Metrics): string {
  const title = escapeHtml(m.channelTitle);
  const date = formatDateRu(m.reportDate);

  return [
    `<b>📊 Статистика Telegram-канала ${title} (${date})</b>`,
    '',
    'Канал уверенно растёт и показывает стабильные рекламные показатели в нише 18+ с живой, вовлечённой аудиторией.',
    '',
    `🔹 Подписчики: ${n(m.subscribers)}`,
    '➡️ активный приток новой аудитории, канал находится в фазе роста',
    '',
    '🔹 Охваты:',
    `— средний охват поста: ${m.avgPostReach === null ? '—' : n(m.avgPostReach)}`,
    `— ERR ${m.err === null ? '—' : `${p(m.err)}%`} — почти каждый подписчик видит контент`,
    `— ERR₍24₎ ${m.err24 === null ? '—' : `${p(m.err24)}%`} — высокий интерес в первые сутки`,
    '',
    '🔹 Рекламные показатели:',
    `— ~${m.adViews24 === null ? '—' : `${n(m.adViews24)} ${pluralRu(m.adViews24, { one: 'просмотр', few: 'просмотра', many: 'просмотров' })}`} за первые 24 часа`,
    `— до ${m.adViews48 === null ? '—' : `${n(m.adViews48)} ${pluralRu(m.adViews48, { one: 'просмотр', few: 'просмотра', many: 'просмотров' })}`} за 48 часов`,
    '➡️ реклама продолжает добирать охват, а не «умирает» после публикации',
    '',
    '🔹 Цитируемость и распространение:',
    `— индекс цитирования: ${m.citationIndex === null ? '—' : m.citationIndex}`,
    `— ${m.citingChannels === null ? '—' : n(m.citingChannels)} канала ссылаются на контент`,
    (() => {
      if (m.mentions === null || m.reposts === null) {
        return `— ${m.mentions === null ? '—' : n(m.mentions)} упоминания и ${m.reposts === null ? '—' : n(m.reposts)} репоста`;
      }

      const mentions = `${n(m.mentions)} ${pluralRu(m.mentions, { one: 'упоминание', few: 'упоминания', many: 'упоминаний' })}`;
      const reposts = `${n(m.reposts)} ${pluralRu(m.reposts, { one: 'репост', few: 'репоста', many: 'репостов' })}`;

      return `— ${mentions} и ${reposts}`;
    })(),
    '➡️ контент активно разлетается по Telegram',
    '',
    `🔹 Возраст канала: ${m.channelAgeMonths === null ? '—' : `~${m.channelAgeMonths} ${pluralRu(m.channelAgeMonths, { one: 'месяц', few: 'месяца', many: 'месяцев' })}`}`,
    '➡️ молодая аудитория без выгорания и рекламной слепоты',
  ].join('\n');
}

export type { Metrics };
