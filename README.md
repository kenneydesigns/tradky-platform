# SBIR/STTR Proposal Evaluation MVP

Standalone React app for evaluating SBIR/STTR proposal drafts and developing technical volume sections. It is designed to run independently now and later be embedded in a protected WordPress membership page with an iframe.

## Features

- Logged-in-style dashboard for locally saved projects
- New project flow with agency, program, phase, topic ID, and due date
- Paste or upload solicitation/topic text
- Paste or upload draft proposal/technical volume files, including TXT, Markdown, DOCX, and PDF
- Pre-populate builder sections from uploaded technical volume headings and content
- OpenAI-backed evaluation using the DAF/AFWERX 2024 MTE rubric for Commercialization, Defense Need, Technical Merit, and cost-volume checks
- Editable technical volume builder with section completeness meters, evaluator suggestions, and AI-assisted drafts
- Export technical volume draft to Markdown or DOCX
- Browser localStorage persistence for MVP project data

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## ChatGPT Apps MCP Server

This project is a Vite React app deployed on Vercel with serverless functions in `api/`. The ChatGPT Apps MCP endpoint is implemented as a Vercel function at `/api/mcp` and exposed through a rewrite at:

```text
https://tradky-platform.vercel.app/mcp
```

Use this URL in the ChatGPT Apps MCP Server field:

```text
https://tradky-platform.vercel.app/mcp
```

The server is configured for **No Auth** and exposes these tools:

- `evaluate_proposal`
- `analyze_topic`
- `improve_technical_volume`
- `generate_recommendations`

The OpenAI Apps domain verification route is:

```text
https://tradky-platform.vercel.app/.well-known/openai-apps-challenge
```

Paste the verification token from OpenAI into `OPENAI_APPS_CHALLENGE_TOKEN` in Vercel environment variables. The route returns that token as plain text.

### Test MCP Locally

The Vite dev server runs the web app only. Use Vercel Dev when testing serverless API and MCP routes:

```bash
npm install
npx vercel dev
```

Then test the MCP endpoint with MCP Inspector:

```bash
npx @modelcontextprotocol/inspector http://localhost:3000/mcp
```

You can also verify that the endpoint lists tools with a JSON-RPC request:

```bash
curl -s http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

The response should include the four tool names listed above.

### Deploy to Vercel

Set server-side environment variables in Vercel, then deploy from the connected Git repository or with the Vercel CLI:

```bash
npm run build
vercel --prod
```

After deployment, open the ChatGPT Apps submission flow, choose **No Auth**, paste `https://tradky-platform.vercel.app/mcp`, and click **Scan Tools**. The scan should discover `evaluate_proposal`, `analyze_topic`, `improve_technical_volume`, and `generate_recommendations`.

## Environment

Copy `.env.example` to `.env.local` for local configuration.

```bash
VITE_AI_MODE=mock
VITE_AI_ENDPOINT=/api/evaluate
VITE_AI_DRAFT_ENDPOINT=/api/draft-sections
VITE_AI_SUGGESTIONS_ENDPOINT=/api/section-suggestions
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
OPENAI_REASONING_EFFORT=low
OPENAI_APPS_CHALLENGE_TOKEN=
```

Keep provider API keys server-side only. Do not expose private keys with a `VITE_` prefix. The current UI calls `src/services/aiClient.ts`, which defaults to `/api/evaluate`, `/api/draft-sections`, and `/api/section-suggestions` in production and mock responses in local dev unless `VITE_AI_MODE` is set.

See `docs/openai-api-setup.md` for OpenAI credits, API key, and Vercel environment variable setup.

## File Structure

```text
src/
  components/          React UI modules
  data/                Default technical volume section definitions
  services/            Local project store and AI client boundary
  utils/               Export and file helpers
  App.tsx              App shell and project state orchestration
  styles.css           Responsive application styling
```

## WordPress Embedding

Deploy this app to Vercel or Netlify, then embed the deployed URL in a protected WordPress page:

```html
<iframe
  src="https://your-proposal-tool.example.com"
  width="100%"
  height="900"
  style="border:0;"
  loading="lazy"
></iframe>
```

For the MVP, WordPress should handle payment and access control. The app does not assume WordPress authentication.

See `docs/wordpress-deployment.md` for Vercel, Netlify, and same-host WordPress deployment steps.
