# WordPress Deployment Guide

The recommended MVP setup is to deploy this React app separately, then iframe it into a protected WordPress page. WordPress handles payments, login, and membership access. This app remains a standalone tool.

## Recommended Option: Vercel or Netlify

1. Push this project to a GitHub repository.
2. Import the repository into Vercel or Netlify.
3. Use these settings:

```text
Build command: npm run build
Publish/output directory: dist
```

4. Set `VITE_AI_MODE=api` after `OPENAI_API_KEY` is configured in Vercel.
5. Deploy and copy the production URL.
6. Add the iframe snippet below to the protected WordPress page.

```html
<iframe
  src="https://YOUR-DEPLOYED-APP-URL"
  width="100%"
  height="950"
  style="width:100%;border:0;display:block;"
  loading="lazy"
  title="SBIR/STTR Proposal Evaluation Tool"
></iframe>
```

## WordPress Page Setup

Use the WordPress Custom HTML block on a protected membership page. The page should be accessible only to paid or approved members through your membership plugin.

For best results:

- Use a full-width page template.
- Hide the WordPress page title if the theme allows it.
- Set iframe height between `900` and `1100` pixels for the MVP.
- Keep the deployed app and WordPress site on HTTPS.

## Alternate Option: Upload Static Files to WordPress Hosting

If you prefer to host the app on the same server as WordPress:

1. Run `npm run build`.
2. Upload the contents of `dist/` to a folder such as `/proposal-tool/` on the WordPress host.
3. Embed it with:

```html
<iframe
  src="https://YOUR-WORDPRESS-DOMAIN.com/proposal-tool/"
  width="100%"
  height="950"
  style="width:100%;border:0;display:block;"
  loading="lazy"
  title="SBIR/STTR Proposal Evaluation Tool"
></iframe>
```

The Vite config uses relative asset paths, so the built app can work from a subfolder such as `/proposal-tool/`.

## Important MVP Notes

- Project data is saved in each user's browser with `localStorage`.
- Clearing browser data will remove locally saved projects.
- The OpenAI API key must live in the Vercel server environment, not in WordPress page HTML and not in a `VITE_` environment variable.
- Point `VITE_AI_ENDPOINT` to `/api/evaluate`.
