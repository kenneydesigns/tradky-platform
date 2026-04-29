# OpenAI API Setup

This app uses a Vercel serverless function at `/api/evaluate` to call OpenAI. The browser never receives the OpenAI API key.

## 1. Add OpenAI API credits

1. Go to the OpenAI billing overview: https://platform.openai.com/settings/organization/billing/overview
2. Click **Add payment details**.
3. Purchase prepaid API credits. OpenAI currently lists a $5 minimum purchase, with the maximum based on account trust tier.
4. Optionally enable auto-recharge and a monthly recharge cap.

OpenAI notes that purchased credits expire after 1 year and are non-refundable.

## 2. Create an API key

1. Go to API keys: https://platform.openai.com/api-keys
2. Create a project API key.
3. Copy the key once. Do not put it in WordPress, client-side JavaScript, or any `VITE_` variable.

## 3. Add Vercel environment variables

In the Vercel project settings for `tradky-platform`, add these production variables:

```text
OPENAI_API_KEY=your OpenAI API key
OPENAI_MODEL=gpt-5.4-mini
OPENAI_REASONING_EFFORT=low
VITE_AI_MODE=api
VITE_AI_ENDPOINT=/api/evaluate
```

`VITE_AI_MODE=api` is optional for production because the deployed app defaults to the API endpoint. It is useful to make the setting explicit. `OPENAI_MODEL` can be changed later. The default code value is `gpt-5.4-mini`, a lower-cost model recommended by OpenAI docs for latency and cost-sensitive workloads.

## 4. Redeploy

After changing Vercel environment variables, redeploy production:

```bash
npx vercel deploy --prod --yes
```

## 5. Test

Open the Vercel app, paste solicitation and draft proposal text, and run an evaluation. If the key or credits are missing, the app will show the server error returned by `/api/evaluate`.
