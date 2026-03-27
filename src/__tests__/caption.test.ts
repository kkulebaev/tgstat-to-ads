import { describe, expect, it } from 'vitest';
import { buildCaptionHtml } from '../caption.js';

describe('buildCaptionHtml', () => {
  it('builds stable caption and escapes HTML in title', () => {
    const text = buildCaptionHtml({
      channelTitle: 'Nude <Vision> & Co',
      reportDate: new Date('2026-02-26T00:00:00Z'),
      subscribers: 1805,
      avgPostReach: 1687,
      err: 93.5,
      err24: 24,
      adViews24: 401,
      adViews48: 579,
      citationIndex: 7.0,
      citingChannels: 23,
      mentions: 42,
      reposts: 22,
      channelAgeMonths: 5,
    });

    expect(text).toContain('<b>📊 Статистика Telegram-канала Nude &lt;Vision&gt; &amp; Co (26.02.2026)</b>');
    expect(text).toContain('🔹 Подписчики: 1');
    expect(text).toMatch(/🔹 Подписчики: 1\s*805/);
    expect(text).toContain('ERR 93.5%');
    expect(text).toContain('ERR₍24₎ 24%');
  });
});
