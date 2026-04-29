# SBIR/STTR Proposal Evaluation MVP

Standalone React app for evaluating SBIR/STTR proposal drafts and developing technical volume sections. It is designed to run independently now and later be embedded in a protected WordPress membership page with an iframe.

## Features

- Logged-in-style dashboard for locally saved projects
- New project flow with agency, program, phase, topic ID, and due date
- Paste or upload solicitation/topic text
- Paste or upload draft proposal/technical volume text
- Mock AI evaluation covering strengths, weaknesses, compliance gaps, technical merit, commercialization, DoD transition potential, and rewrite actions
- Editable technical volume builder with eight proposal sections
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

## Environment

Copy `.env.example` to `.env.local` for local configuration.

```bash
VITE_AI_MODE=mock
VITE_AI_ENDPOINT=/api/evaluate
AI_PROVIDER_API_KEY=
```

Keep provider API keys server-side only. Do not expose private keys with a `VITE_` prefix. The current UI calls `src/services/aiClient.ts`, which uses mock responses unless `VITE_AI_MODE` is changed and a backend endpoint is provided.

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
