export type TelegramOk<T> = { ok: true; result: T };
export type TelegramErr = { ok: false; error_code: number; description: string };
export type TelegramResponse<T> = TelegramOk<T> | TelegramErr;

export type TelegramMessage = {
  message_id: number;
};

function apiUrl(token: string, method: string): string {
  return `https://api.telegram.org/bot${token}/${method}`;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json: unknown = await res.json();
  return json as T;
}

export async function deleteMessage(params: {
  token: string;
  chatId: string;
  messageId: number;
}): Promise<void> {
  const data = await postJson<TelegramResponse<boolean>>(
    apiUrl(params.token, 'deleteMessage'),
    { chat_id: params.chatId, message_id: params.messageId },
  );

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
  const data = await postJson<TelegramResponse<TelegramMessage>>(
    apiUrl(params.token, 'sendMessage'),
    {
      chat_id: params.chatId,
      text: params.text,
      parse_mode: params.parseMode,
      reply_markup: params.replyMarkup,
    },
  );

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
  const imageRes = await fetch(params.photoUrl);
  if (!imageRes.ok) {
    throw new Error(`Failed to fetch image: ${imageRes.status}`);
  }

  const mime = imageRes.headers.get('content-type') ?? 'image/png';
  const buf = Buffer.from(await imageRes.arrayBuffer());

  const form = new FormData();
  form.set('chat_id', params.chatId);
  form.set('caption', params.caption);
  form.set('parse_mode', params.parseMode);
  form.set('photo', new Blob([buf], { type: mime }), 'stat-widget.png');

  const res = await fetch(apiUrl(params.token, 'sendPhoto'), {
    method: 'POST',
    body: form,
  });

  const json: unknown = await res.json();
  const data = json as TelegramResponse<TelegramMessage>;
  if (!data.ok) {
    throw new Error(`Telegram sendPhoto failed: ${data.error_code} ${data.description}`);
  }

  return data.result;
}
