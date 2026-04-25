# business-website
Simple business website for Kabroad.

## Blog + CMS architecture

This site now includes a static blog system designed for non-technical editing:

- Public blog list: `/blog/index.html`
- Public post template: `/blog/post.html?slug=...`
- Content source: `/content/blog/posts.json`
- CMS UI: `/admin/` (Decap CMS)

### Why this approach

- Keeps the site static (no backend app, no build pipeline required)
- Decap CMS provides a friendly editor for creating/updating posts
- Blog rendering is handled by lightweight client-side JavaScript (`/js/blog.js`)
- Low maintenance: one content file plus simple HTML/CSS/JS

## One-time setup for publishing

1. Update `/admin/config.yml`:
   - Replace `REPLACE_WITH_OWNER/REPLACE_WITH_REPO` with your actual GitHub repository.
   - Keep `branch` aligned with your production branch.
2. Configure Decap authentication:
   - For `backend: github`, set up the required OAuth flow/proxy once.
   - If you host on Netlify and want a simpler non-technical login, switch to `backend: git-gateway` and enable Netlify Identity + Git Gateway.
3. Ensure your static host deploys the repository automatically on push.
4. Open `/admin/` and log in.
5. In **Posts**, add/edit entries and save changes.

After setup, posts can be created, edited, and published without developer involvement.
