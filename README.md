# GitHub Explorer

A single-page web app with two main tabs:

- **Explorer** — look up any GitHub user's starred repos and following list, with sorting, filtering, and CSV/JSON export.
- **Migrate** — import a starred-repos list or following list from another account and bulk-star / bulk-follow on your current account.

---

## Features

### Explorer Tab
- **Username search** — look up any public GitHub user or organization.
- **Profile card** — avatar, bio, company, location, blog link, repo/follower/following counts.
- **Starred repos table** — sortable by name, stars, forks, language, and last-updated date; filterable by keyword across name, description, language, and topics.
- **Following grid** — responsive card grid with avatar, username, and account type; filterable by username.
- **Export** — download the current (filtered) view as CSV or JSON for either tab.

### Migrate Tab
- **Star Repos** — paste or upload a list of `owner/repo` or GitHub URLs. Check which ones are already starred, then star individually or bulk-star all remaining.
- **Follow Users** — paste or upload a CSV / username list. Check follow status, then follow individually or bulk-follow all remaining.
- **Progress indicators** — progress bars during bulk operations with automatic rate-limit detection.

### Shared
- **Optional GitHub PAT** — provide a Personal Access Token to raise the API rate limit from 60 → 5 000 req/hr. **Required** for Migrate tab (write operations). The token is persisted in `localStorage` and never sent to any server other than `api.github.com`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI library | [React 19](https://react.dev) |
| Language | [TypeScript 5](https://www.typescriptlang.org) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Components | [shadcn/ui](https://ui.shadcn.com) (base-nova style) |
| Icons | [Lucide React](https://lucide.dev) |

---

## Prerequisites

- **Node.js** ≥ 18
- **npm**, **yarn**, **pnpm**, or **bun**

---

## Getting Started

```bash
# 1. Clone the repository
git clone <repo-url>
cd github_transfer

# 2. Install dependencies
npm install        # or yarn / pnpm install / bun install

# 3. Start the development server (use --webpack, see "Known Issues" below)
npx next dev --webpack
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** Do **not** use the default `npm run dev` — it launches Turbopack, which crashes in a reload loop on Next.js 16.2.3. Always start with `npx next dev --webpack`.

---

## Usage

### Explorer

1. **(Optional) Enter a GitHub Personal Access Token** in the header input. This is only needed if you hit the unauthenticated rate limit (60 requests/hour). The token is stored in your browser's `localStorage` and sent only to `api.github.com`.
2. **Type a GitHub username** in the search bar and click **Explore**.
3. The app fetches the user profile, all starred repos, and all followed accounts in parallel (with pagination progress indicators).
4. Switch between the **Starred Repos** and **Following** tabs.
5. Use the **filter input** inside each tab to narrow results.
6. Sort the starred-repos table by clicking any column header.
7. Click **CSV** or **JSON** to download the current filtered dataset.

### Migrate

1. **Enter a GitHub Personal Access Token** (required — write operations need auth).
2. Switch to the **Migrate** tab.
3. Choose **Star Repos** or **Follow Users**.
4. **Paste lines** into the text area or **upload a file**:
   - Star Repos: one `owner/repo` or `https://github.com/owner/repo` per line (`.txt`).
   - Follow Users: one username per line, or a CSV with a `username` column (matching the export format from Explorer).
5. Click **Check Status** to see which repos/users are already starred/followed.
6. Click individual **Star** / **Follow** buttons, or use **Star All Remaining** / **Follow All Remaining** for bulk operations.
7. A progress bar tracks bulk operations. If rate-limited, the operation pauses and alerts you.

---

## Project Structure

```
src/
├── app/
│   ├── globals.css        # Tailwind base styles & CSS variables
│   ├── layout.tsx         # Root layout — metadata, fonts, html/body shell
│   ├── page.tsx           # Main page — orchestrates state, data fetching, and UI composition
│   └── favicon.ico
├── components/
│   ├── TokenInput.tsx     # GitHub PAT input with show/hide toggle & localStorage persistence
│   ├── UserSearch.tsx     # Username search form
│   ├── ProfileCard.tsx    # User/org profile card (avatar, bio, stats)
│   ├── StarredReposTable.tsx  # Sortable & filterable table of starred repos + export buttons
│   ├── FollowingList.tsx  # Filterable card grid of followed accounts + export buttons
│   ├── ExportButtons.tsx  # Reusable CSV/JSON download button pair
│   ├── MigrateTab.tsx     # Migrate tab container with Star Repos / Follow Users sub-tabs
│   ├── StarManager.tsx    # Import, check, star/unstar repos from a list
│   ├── FollowManager.tsx  # Import, check, follow/unfollow users from a list
│   ├── FileImport.tsx     # Reusable paste/upload file-import component
│   └── ui/                # shadcn/ui primitives (avatar, badge, button, card, input, separator, skeleton, table, tabs)
├── lib/
│   ├── github.ts          # GitHub REST API client (explore + migrate endpoints)
│   ├── export.ts          # CSV & JSON blob-download helpers
│   └── utils.ts           # Tailwind class-merge utility (cn)
└── types/
    └── github.ts          # TypeScript interfaces: GitHubUser, StarredRepo, FollowingUser, MigrateRepoItem, MigrateUserItem
```

---

## Key Components

| Component | Responsibility |
|-----------|---------------|
| `TokenInput` | Accepts a GitHub PAT, toggles visibility, persists to `localStorage`, and exposes the value to the parent. |
| `UserSearch` | Simple form that emits the trimmed username on submit. |
| `ProfileCard` | Renders the fetched `GitHubUser` object as a rich card with avatar, metadata, and stats. |
| `StarredReposTable` | Displays starred repos in a sortable, filterable table. Provides CSV/JSON export of the current filtered view. |
| `FollowingList` | Displays followed accounts in a responsive grid of cards. Supports filtering and export. |
| `ExportButtons` | Generic pair of CSV and JSON download buttons, reused by both tabs. |
| `MigrateTab` | Container for the Migrate tab with Star Repos / Follow Users sub-tabs. |
| `StarManager` | Import a repo list (paste/upload), check star status, star/unstar individually or in bulk. |
| `FollowManager` | Import a user list (paste/upload), check follow status, follow/unfollow individually or in bulk. |
| `FileImport` | Reusable textarea + file-upload component that parses lines and emits them to the parent. |

---

## API Layer

### `src/lib/github.ts`

All data comes from the public [GitHub REST API v3](https://docs.github.com/en/rest).

**Explorer endpoints:**
- **`fetchUser(username, token?)`** — `GET /users/:username`. Returns the `GitHubUser` profile.
- **`fetchStarredRepos(username, token?, onProgress?)`** — `GET /users/:username/starred`. Paginates through all pages (100 per page) by following the `Link: <…>; rel="next"` header. Calls `onProgress` after each page so the UI can show a count.
- **`fetchFollowing(username, token?, onProgress?)`** — `GET /users/:username/following`. Same pagination strategy.

**Migrate endpoints (all require a PAT):**
- **`fetchAllStarredRepoNames(token, onProgress?)`** — fetches all repos the authenticated user has starred. Returns a `Set<string>` of `owner/repo` names.
- **`starRepo(repo, token)`** / **`unstarRepo(repo, token)`** — `PUT` / `DELETE /user/starred/:owner/:repo`.
- **`checkFollowingUser(username, token)`** — `GET /user/following/:username`. Returns `true` (204) if following.
- **`followUser(username, token)`** / **`unfollowUser(username, token)`** — `PUT` / `DELETE /user/following/:username`.

If a token is provided it is sent as a `Bearer` token in the `Authorization` header.

### `src/lib/export.ts`

- **`exportToCSV(data, filename)`** — converts an array of objects to a CSV string (with proper field escaping) and triggers a browser download via a Blob URL.
- **`exportToJSON(data, filename)`** — converts to pretty-printed JSON and triggers a download.

---

## Environment & Configuration

| File | Purpose |
|------|---------|
| `next.config.ts` | Sets `allowedDevOrigins` for the dev server. Add your network IP here if you access the app from another device (see Troubleshooting). |
| `components.json` | shadcn/ui config — base-nova style, Lucide icons, Tailwind CSS variables, path aliases. |
| `tsconfig.json` | TypeScript config with `@/*` path alias pointing to `./src/*`. |

No `.env` file is required. The app calls the GitHub API directly from the browser — no server-side secrets are needed.

---

## Build & Deploy

```bash
# Production build
npm run build

# Start the production server
npm start
```

The app can be deployed to any platform that supports Next.js. For the simplest path, use [Vercel](https://vercel.com/new):

1. Push the repo to GitHub.
2. Import the project in Vercel.
3. Vercel auto-detects Next.js and deploys — no extra configuration needed.

---

## Troubleshooting

### Turbopack crash / infinite reload loop

The default `npm run dev` uses Turbopack, which panics repeatedly on Next.js 16.2.3 and causes the browser to enter an infinite reload loop. **Always use Webpack mode instead:**

```bash
npx next dev --webpack
```

If you already hit the loop, stop the server (`Ctrl+C`), delete the build cache, and restart:

```bash
rm -rf .next
npx next dev --webpack
```

### "Blocked cross-origin request" warning

When accessing the dev server over a network IP (e.g. `172.16.x.x` from another machine), you may see:

```
⚠ Blocked cross-origin request to Next.js dev resource /_next/webpack-hmr
```

This only affects **Hot Module Replacement** in development — the app itself works fine. To suppress it and enable HMR over the network, add your IP to `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost", "<your-network-ip>"],
};
```

Then restart the dev server.

### GitHub API rate limit (403)

Without a token the GitHub API allows **60 requests/hour**. For users with many starred repos this can be exhausted in a single search. Paste a [Personal Access Token](https://github.com/settings/tokens) (no scopes needed) into the header input to raise the limit to **5 000 req/hr**.
