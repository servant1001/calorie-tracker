# Calorie AI Gateway

Cloudflare Workers backend for Calorie Tracker AI features.

## Current endpoints

- `POST /api/ai/parse-food-text`
- `POST /api/ai/daily-summary`
- `POST /api/ai/meal-photo`

## Current routing model

The Worker supports:

- multiple providers in order via `AI_PROVIDER_ORDER`
- multiple API keys per provider
- automatic fallback to the next key or provider when a request fails

Implemented adapters:

- `groq`
- `openai`
- `openai_compat`

`openai_compat` is for OpenAI-compatible gateways such as an internal proxy or another provider that supports the Chat Completions JSON schema flow.

`groq` is configured as a first-class provider using Groq's OpenAI-compatible endpoint and structured JSON schema output support.

## Local setup

1. Install dependencies.
2. Copy `.dev.vars.example` to `.dev.vars`.
3. Fill in your API keys.
4. Run `npm run dev`.

Example Groq setup:

```env
GROQ_MODEL=openai/gpt-oss-120b
GROQ_API_KEYS_JSON=["gsk-your-primary-key","gsk-your-backup-key"]
OPENAI_API_KEYS_JSON=[]
OPENAI_COMPAT_API_KEYS_JSON=[]
```

## Frontend setup

Set this in the Vue app `.env`:

```env
VITE_AI_GATEWAY_BASE_URL=http://127.0.0.1:8787
```

## Notes

- All AI responses are returned in Traditional Chinese.
- Food parsing and photo parsing return structured JSON for user confirmation before saving to Firebase.
- Daily summary is generated on demand to avoid unnecessary homepage latency and token cost.
- Default provider order is `groq,openai,openai_compat`.
