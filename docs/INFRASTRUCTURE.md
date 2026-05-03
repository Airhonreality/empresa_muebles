# Infrastructure Guide — Agnostic Seed v2

## Architecture Overview

The Agnostic Seed runs in two modes based on environment variables:

| Mode | Condition | Storage |
|------|-----------|---------|
| **Local** | `GITHUB_TOKEN` not set | `data-silo/db.json` on disk |
| **Cloud** | `GITHUB_TOKEN` is set | GitHub file via REST API |

The client **never knows** which strategy is active. All persistence goes through
`/api/vault` (GET to read, POST to write). The strategy is selected server-side.

---

## Local Development

```bash
# 1. Clone the seed
git clone <repo> my-project
cd my-project

# 2. Install dependencies
npm install

# 3. Start the dev server (no .env needed — local mode is the default)
npm run dev
# → http://localhost:3000/schema
```

The `data-silo/` directory is created automatically on first write. It is
**gitignored** — it contains business data, not framework code.

---

## data-silo/ Structure

```
data-silo/
├── db.json          # Main database (all contexts in one file)
├── assets/          # Uploaded files (served via /api/assets/*)
├── modules/         # Injectable JS modules (served via /api/modules/*)
└── styles/
    └── theme.css    # Optional: overrides framework CSS variables
```

### theme.css example

```css
:root {
  --accent: #e67e22;
  --surface-0: #fdf6ec;
  --text-primary: #2c1810;
}
```

### Dynamic Module contract

Files in `data-silo/modules/` must export a `render` function:

```javascript
// data-silo/modules/MyWidget.js
export const render = ({ state, dispatch, React }) => {
  return React.createElement('div', null, 'Hello from MyWidget!');
};
```

---

## Deploying to Vercel

### 1. Set environment variables

In your Vercel project settings, add:

```
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=your-github-username
GITHUB_REPO=your-data-repo
GITHUB_FILE_PATH=db.json
GITHUB_BRANCH=main
```

### 2. Create a data repository

Create a **private** GitHub repository to hold your `db.json`. The seed will
read from and write to this file via the GitHub Contents API.

### 3. Deploy

```bash
vercel --prod
```

The app will boot and auto-detect the GitHub strategy. No `data-silo/` directory
is needed on the server.

---

## Creating a New Project from the Seed

```bash
# Clone or fork the seed
git clone https://github.com/your/agnostic-seed my-new-project
cd my-new-project

# Create your data silo (gitignored)
mkdir -p data-silo/assets data-silo/modules data-silo/styles

# Start dev
npm install && npm run dev

# → Visit /schema to configure your schemas and routes
```

**Golden Rules:**
1. Never add business logic to `src/` — it belongs in `data-silo/modules/`.
2. Never commit `data-silo/db.json` — it contains client data.
3. Never hardcode styles in components — use `data-silo/styles/theme.css`.
4. The seed must work with `npm run dev` and zero configuration.
