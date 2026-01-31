# Deploying to GitHub Pages

## Why it broke locally vs GitHub Pages

- **Locally** (`npm run dev`): Vite serves `public/` at the site root, so `public/js/` is available as `/js/`, and the built files in `dist/` are served too.
- **On GitHub Pages** (deploy from branch `main`, root): The repo root is served as-is. So:
  - There is no `js/` at root—only `public/js/`, so requests to `/js/...` return 404.
  - The `dist/` folder is in `.gitignore`, so it is never on GitHub and `/dist/...` also returns 404.

So tabs that depend on those scripts fail on the live site.

## Fix: Deploy a built site to the `gh-pages` branch

A GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) does the following on every push to `main`:

1. Runs `npm run build` (creates `dist/character-sheet.js` and `dist/play-webllm.js`).
2. Assembles a site folder with: `index.html`, `css/`, `assets/`, `dist/`, and `js/` (copy of `public/js/`).
3. Pushes that folder to the `gh-pages` branch.

## Steps for you

1. **Push the workflow**  
   Commit and push the new `.github/workflows/deploy-pages.yml` (and this doc if you want) to `main`.

2. **Run the workflow**  
   After the push, the workflow runs automatically. Check **Actions** in your repo to see the run and that it succeeds. The first run will create the `gh-pages` branch.

3. **Point GitHub Pages at `gh-pages`**  
   In the repo: **Settings → Pages**:
   - **Build and deployment → Source**: “Deploy from a branch”.
   - **Branch**: choose `gh-pages` (not `main`).
   - **Folder**: `/ (root)`.
   - Save.

After that, the live site is built from the `gh-pages` branch and will have `js/` and `dist/` at the root, so the tabs and scripts will load correctly.

## Manual deploy (optional)

If you ever want to build and deploy from your machine instead of Actions:

1. Run `npm run build`.
2. Create a folder with: `index.html`, `css/`, `assets/`, `dist/`, and copy `public/js` as `js/`.
3. Push that folder’s contents to the `gh-pages` branch (e.g. with `gh-pages` npm package or by copying into a clone of `gh-pages` and pushing).

The workflow automates this so you don’t have to do it by hand.
