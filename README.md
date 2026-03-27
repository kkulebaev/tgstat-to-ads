# tgstat-to-ads

Сервис, который раз в неделю публикует в Telegram-канал пост с картинкой TGStat + текстом статистики и следом CTA-сообщение с кнопкой.

## Что делает

- Загружает из Postgres последние `photo_message_id` и `cta_message_id`
- Пытается удалить эти сообщения (ошибки игнорируются)
- Запрашивает статистику TGStat
- Скачивает PNG-виджет TGStat и отправляет его в канал как фото с HTML-caption
- Отправляет CTA-сообщение с inline-кнопкой
- Сохраняет новые message_id в Postgres

## Endpoints

- (HTTP endpoints отсутствуют) — джоба запускается командой `npm run cron:prod`

## ENV

- `PORT`
- `DATABASE_URL`
- `CRON_SECRET`
- `TELEGRAM_ADS_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `TGSTAT_TOKEN`
- `TGSTAT_CHANNEL_ID`
- `TGSTAT_WIDGET_URL`
- `CTA_URL`

## Локальный запуск

```bash
npm i
export DATABASE_URL='postgres://...'
export CRON_SECRET='...'
export TELEGRAM_ADS_BOT_TOKEN='...'
export TELEGRAM_CHAT_ID='-100...'
export TGSTAT_TOKEN='...'
export TGSTAT_CHANNEL_ID='...'
export TGSTAT_WIDGET_URL='https://tgstat.ru/channel/.../stat-widget.png'
export CTA_URL='https://t.me/...'

npm run dev
```

Запуск джобы:

```bash
curl -X POST http://localhost:3000/run \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Railway

1. Создай проект, подключи репозиторий
2. Добавь Postgres (Railway plugin) и переменные окружения выше
3. Cron: настроить Railway Cron, который делает `POST https://<service>.up.railway.app/run` с заголовком `Authorization: Bearer <CRON_SECRET>`

> Важно: Railway Cron должен уметь выставлять заголовок. Если нет — можно добавить query-параметр `?secret=...` (но это менее безопасно). Сейчас реализован только Bearer.
