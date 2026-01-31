# Deploying to GitHub Pages

## Why it broke locally vs GitHub Pages

- **Locally** (`npm run dev`): Vite serves `public/` at the site root, so `public/js/` is available as `/js/`, and the built files in `dist/` are served too.
- **On GitHub Pages** (deploy from branch `main`, root): The repo root is served as-is. So:
  - There is no `js/` at root—only `public/js/`, so requests to `/js/...` return 404.
  - The `dist/` folder is in `.gitignore`, so it is never on GitHub and `/dist/...` also returns 404.

So tabs that depend on those scripts fail on the live site.

## Fix: Deploy with GitHub Actions (no branch push)

The workflow (`.github/workflows/deploy-pages.yml`) uses GitHub’s **official** Pages deployment:

1. **build** job: runs `npm run build`, assembles a `site/` folder with `index.html`, `css/`, `assets/`, `dist/`, and `js/` (from `public/js/`), then uploads it as an artifact.
2. **deploy** job: deploys that artifact to GitHub Pages. There is **no `gh-pages` branch** and no push to the repo, so you avoid permission errors.

## One-time setup

1. **Use “GitHub Actions” as the source**  
   In the repo: **Settings → Pages**:
   - Under **Build and deployment**, set **Source** to **“GitHub Actions”** (not “Deploy from a branch”).
   - You may see suggested workflows (**GitHub Pages Jekyll**, **Static HTML**, etc.). **Do not choose those.** Your repo already has a custom workflow (`.github/workflows/deploy-pages.yml`). Leave them and do not create a new workflow.
   - Save if needed.

2. **Push the workflow**  
   Commit and push `.github/workflows/deploy-pages.yml` to `main`.

3. **Run the workflow**  
   On the next push to `main` the workflow runs automatically. You can also run it manually: **Actions** tab → “Deploy to GitHub Pages” → “Run workflow”.

After the deploy job succeeds, the site will be live with `js/` and `dist/` at the root, and the tabs will work.

## If you see “Permission denied” or 403

The workflow no longer pushes to a branch; it uses `actions/upload-pages-artifact` and `actions/deploy-pages`. If you still get errors:

- Ensure **Settings → Pages → Source** is **“GitHub Actions”**.
- Ensure the **deploy** job has the `github-pages` environment (the workflow sets `environment: name: github-pages`). If your repo doesn’t have that environment yet, it is created when you first run the workflow.

## Manual deploy (optional)

If you want to build and deploy from your machine:

1. Run `npm run build`.
2. Create a folder with: `index.html`, `css/`, `assets/`, `dist/`, and copy `public/js` as `js/`.
3. Use the `gh-pages` npm package or another method to push that folder to a branch and point Pages at it. The automated workflow is usually easier.
