import { request, FormData } from 'undici';

export type TelegramOk<T> = { ok: true; result: T };
export type TelegramErr = { ok: false; error_code: number; description: string };
export type TelegramResponse<T> = TelegramOk<T> | TelegramErr;

export type TelegramMessage = {
  message_id: number;
};

function apiUrl(token: string, method: string): string {
  return `https://api.telegram.org/bot${token}/${method}`;
}

export async function deleteMessage(params: {
  token: string;
  chatId: string;
  messageId: number;
}): Promise<void> {
  const res = await request(apiUrl(params.token, 'deleteMessage'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: params.chatId, message_id: params.messageId }),
  });

  const json: unknown = await res.body.json();
  const data = json as TelegramResponse<boolean>;
  if (!data.ok) {
    throw new Error(`Telegram deleteMessage failed: ${data.error_code} ${data.description}`);
  }
}

export async function sendMessage(params: {
  token: string;
  chatId: string;
  text: string;
  replyMarkup?: unknown;
  parseMode?: 'HTML' | 'MarkdownV2' | 'Markdown';
}): Promise<TelegramMessage> {
  const res = await request(apiUrl(params.token, 'sendMessage'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: params.chatId,
      text: params.text,
      parse_mode: params.parseMode,
      reply_markup: params.replyMarkup,
    }),
  });

  const json: unknown = await res.body.json();
  const data = json as TelegramResponse<TelegramMessage>;
  if (!data.ok) {
    throw new Error(`Telegram sendMessage failed: ${data.error_code} ${data.description}`);
  }

  return data.result;
}

export async function sendPhotoFromUrl(params: {
  token: string;
  chatId: string;
  photoUrl: string;
  caption: string;
  parseMode: 'HTML';
}): Promise<TelegramMessage> {
  const imageRes = await request(params.photoUrl, { method: 'GET' });
  if (imageRes.statusCode < 200 || imageRes.statusCode >= 300) {
    throw new Error(`Failed to fetch image: ${imageRes.statusCode}`);
  }

  const contentType = imageRes.headers['content-type'];
  const mime = Array.isArray(contentType) ? contentType[0] : contentType;

  const form = new FormData();
  form.set('chat_id', params.chatId);
  form.set('caption', params.caption);
  form.set('parse_mode', params.parseMode);
  // undici FormData accepts Blob; Response body is a web ReadableStream, so we buffer.
  const buf = Buffer.from(await imageRes.body.arrayBuffer());
  const blob = new Blob([buf], {
    type: typeof mime === 'string' ? mime : 'image/png',
  });
  form.set('photo', blob, 'stat-widget.png');

  const res = await request(apiUrl(params.token, 'sendPhoto'), {
    method: 'POST',
    body: form,
  });

  const json: unknown = await res.body.json();
  const data = json as TelegramResponse<TelegramMessage>;
  if (!data.ok) {
    throw new Error(`Telegram sendPhoto failed: ${data.error_code} ${data.description}`);
  }

  return data.result;
}
