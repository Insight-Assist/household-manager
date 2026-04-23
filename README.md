# House Manager

A personal household planning app for a Spokane, WA family. Generates
AI-drafted weekly plans for your part-time household manager
(Tuesdays + Thursdays), tailored to your standing duties, this week's
needs, and seasonal Spokane considerations. Editable, printable, saved
to a month-organized library.

## What's in the app

There are two tabs. **Plans** is the default landing view — your household manager opens this to see her current week. **Plan Builder** is where you generate and edit standing duties.

- **Plans (default tab):** the most recent plan is featured at the top with a big "Open Plan" button; below it, past weeks are listed by month with hours summaries.
- **Plan Builder:** generate new AI-drafted plans from your week notes; edit your standing duties.
- **Editable plan view:** every task has a checkbox the manager can tick off; each day has an Hours Worked input and a separate "Household Manager's Notes" area below your planning notes. Auto-saves on every change.
- **Print:** prints with empty checkboxes, blank hours field, and blank manager notes — ready for a paper-based shift. Screen view keeps everything she's input.
- **Overflow menu (···) on each plan:** Copy to New Week (uses the plan as a template, resets checks/hours/manager notes), Reset Checkmarks & Hours (keeps manager notes), Delete This Plan.
- **Mobile-friendly:** designed to work as well on a phone as on a desktop. Touch targets are sized for fingers; the toolbar adapts; the duties editor uses bigger inputs on mobile.

---

## What you need

You'll need accounts on:

- **GitHub** — to host the code
- **Netlify** — to host the site + run the AI proxy function
- **Supabase** — to store standing duties + saved plans
- **Anthropic** — for the AI itself (you'll need an API key)

You already have the first three. For Anthropic, sign up at
[console.anthropic.com](https://console.anthropic.com), add a small
amount of credit ($5 is plenty for months of personal use), and create
an API key. Save it somewhere safe.

---

## Setup walkthrough

### Step 1 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
   (or pick an existing one). Wait for it to finish provisioning.
2. In the left sidebar, click **SQL Editor** → **New query**.
3. Open `supabase-schema.sql` from this repo, copy its contents, paste
   into the Supabase SQL editor, and click **Run**. You should see
   "Success. No rows returned."
4. In the left sidebar, click **Project Settings** (gear icon) →
   **API**.
5. Copy two values into a password manager or secure note:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public** key (a long string starting with `eyJ...`)

The `anon` key is safe to put in client-side code — it's designed to
be public. Your data is protected by being on a personal URL you don't
share, plus Row Level Security if you choose to enable it later.

### Step 2 — Push to GitHub

1. Create a new repo on GitHub (private is fine, public works too).
2. From your terminal, in the project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

> **Note:** `config.js` is gitignored, so your secrets never get
> committed. The committed `config.example.js` is just a template.

### Step 3 — Deploy to Netlify

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site**
   → **Import an existing project**.
2. Pick **GitHub** and authorize Netlify if prompted.
3. Select your new repo.
4. On the **Deploy settings** screen, leave all the defaults — the
   `netlify.toml` file in this repo specifies everything.
   Click **Deploy site**.
5. Wait ~30 seconds for the first deploy. **It will succeed but the
   app will show a warning** because env vars aren't set yet — that's
   expected. Continue to Step 4.

### Step 4 — Add your three environment variables

This is the one-time bit of setup. After this, you never touch it
again — even when updating the app.

1. In Netlify, go to your new site → **Site configuration** →
   **Environment variables**.
2. Click **Add a variable** → **Add a single variable** and add each
   of these three:

   | Key                   | Value                                    |
   |-----------------------|------------------------------------------|
   | `ANTHROPIC_API_KEY`   | Your Anthropic API key (`sk-ant-...`)    |
   | `SUPABASE_URL`        | The Project URL from Supabase Step 1     |
   | `SUPABASE_ANON_KEY`   | The anon public key from Supabase Step 1 |

3. Save.
4. Go to the **Deploys** tab → **Trigger deploy** → **Deploy site**.
   This is required because env vars are read at build time. The
   build script will now generate `config.js` automatically with your
   real values.

### Step 5 — Get your URL & try it

Netlify gives you a default URL like
`https://random-name-12345.netlify.app`.

To customize it:

- Go to **Site configuration** → **General** → **Site details** →
  **Change site name**. Pick something like
  `your-name-house-manager.netlify.app`.

- Or hook up your own domain under **Domain management**.

Open the URL on your iPhone or computer:

1. The Plans view loads first (your household manager will see this when she opens the app). To create a new plan, tap **Plan Builder** in the top-right.
2. Type a quick note in "Your thoughts & priorities", e.g. "Liam's
   birthday party Saturday — 12 kids. In-laws Sunday."
3. Tap **Generate Plan**. After ~5–15 seconds you should see your
   editable printable plan with the date, AI-suggested sections, and
   seasonal extras.
4. Edit anything, then tap **Save to Library** and/or **Print**.

---

## Updating the app later

This is the whole point of the env-var setup: **updates are clean.**

When new versions of files come along (say, a new `index.html` or a
tweaked `generate-plan.js`):

1. Drop the new files into your repo (drag-and-drop on GitHub.com
   works fine, or `git pull` / `git push` from terminal).
2. Netlify auto-rebuilds in ~30 seconds.
3. Your `config.js` is regenerated automatically from your env vars
   during build, so your Supabase config stays intact.
4. Your env vars are never touched.

You don't need to re-paste anything. Ever.

---

## Common things you might want to tweak

### The AI prompt and job description
Edit `netlify/functions/generate-plan.js` — see the `JOB_CONTEXT`,
`SEASONAL_HINTS`, and `buildPrompt` function near the top.

### The default standing duties
Edit `index.html` — search for `DEFAULT_STANDING`. Note that once
you've saved customized standing duties to Supabase, the defaults
only matter for new installs or when you click "Reset to Defaults".

### The model
In `netlify/functions/generate-plan.js`, search for `model:` and swap
`claude-sonnet-4-5-20250929` for any other Anthropic model
(e.g. a newer Sonnet or Haiku). Check
[docs.claude.com](https://docs.claude.com) for current model IDs.

### The visual style
All styles live inline in `index.html`. The palette is in
`:root { --ivory ... }` near the top of the `<style>` block.

---

## Local development (optional)

If you want to test changes before pushing:

```bash
# one-time install of Netlify CLI
npm install -g netlify-cli

# from the project folder
cp config.example.js config.js
# edit config.js to add your real Supabase values
cp .env.example .env
# edit .env to add your real ANTHROPIC_API_KEY (and Supabase values)

netlify dev
```

Open `http://localhost:8888` and you can test both the frontend and
the function locally without deploying. Both `config.js` and `.env`
are gitignored, so they stay local-only.

---

## Adding authentication (later)

By default this app has no login — anyone with your Netlify URL can
read and modify your plans. For personal use, just don't share the URL.

If you want real auth:

1. In Supabase, enable **Authentication** → **Providers** → email
   (or Google, etc).
2. In `supabase-schema.sql`, replace the `disable row level security`
   lines with `enable row level security` plus user-id-scoped policies.
3. In `index.html`, add a Supabase auth flow (see
   [supabase.com/docs/guides/auth](https://supabase.com/docs/guides/auth)).

This is more work — only worth doing if you'll share the URL.

---

## Troubleshooting

**App shows "Setup needed: config.js not found"**
Either you haven't completed Step 4 (env vars), or the build hasn't
re-run since you added them. Trigger a fresh deploy in the Netlify
Deploys tab.

**App shows "Setup needed: Supabase not configured"**
The build script ran but env vars were empty. Check Netlify env vars
spelling: `SUPABASE_URL` and `SUPABASE_ANON_KEY` (case matters).

**"Server missing ANTHROPIC_API_KEY environment variable"**
Same thing — env var isn't set. Check Netlify env vars and redeploy.

**"Anthropic API error"**
Either your API key is wrong, your Anthropic credit balance is empty,
or the model ID is no longer valid. Check
[console.anthropic.com](https://console.anthropic.com) → Usage and
Billing.

**Standing duties don't save / Library is empty**
Open browser dev tools (Console tab) and look for Supabase errors.
Most likely your Supabase URL or anon key is wrong, or the database
tables weren't created (re-run `supabase-schema.sql`).

**Print preview is cut off on iOS**
In the AirPrint sheet, tap your printer name and make sure paper size
is **Letter** and scaling is **None** or **Fit to Page**.

---

## File map

```
house-manager-app/
├── index.html                      Frontend (UI + Supabase calls)
├── config.example.js               Template for local config.js
├── config.js                       Local-only, gitignored, your secrets
├── netlify/
│   └── functions/
│       └── generate-plan.js        AI proxy (uses ANTHROPIC_API_KEY)
├── scripts/
│   └── build-config.js             Generates config.js from env vars on Netlify
├── netlify.toml                    Netlify deploy config
├── package.json                    Node version + scripts
├── supabase-schema.sql             Database schema (run once)
├── .env.example                    Local dev env vars template
├── .gitignore                      Keep secrets out of git
└── README.md                       This file
```
