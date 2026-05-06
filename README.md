# XR Station

> A personal RPG-style skill tracker dashboard for cybersecurity and AI learners.

XR Station gamifies your learning journey — turning real-world progress in hacking, coding, fitness, and AI into a character sheet with levels, XP, quests, stats, and titles.

---

## What It Does

Instead of scattered spreadsheets and forgotten notebooks, XR Station gives you a single dashboard where every skill you build feeds into an RPG-style character. Complete HTB machines, solve CTFs, commit code, train physically, sleep well — all of it becomes XP.

### Skill Cards

| Card | What it tracks |
|---|---|
| 🐍 Python Mastery | Level & XP earned via AI-generated quizzes |
| ⬡ Hack The Box | Rank, machines pwned, points (live sync) |
| 🖥 Home Lab | 8 infrastructure milestones (VM → SIEM) |
| ⚑ CTF Challenges | Solves and points |
| ◈ AI / ML Skill | Level, XP, project log with AI-rated complexity |
| ⚔ Physical Stats | STR / DEX / CON derived from real gym metrics |
| ✦ Mental Stats | INT / WIS / CHA derived from study and reading habits |
| ◉ Certifications | Track CompTIA A+, Security+, CEH, OSCP, PNPT, and more |
| ⌬ GitHub Activity | Streak, repo count, contribution heatmap (live sync) |
| ☾ Sleep Tracker | 7-day average hours and quality score |
| ◇ Quest Center | AI-generated daily / weekly / monthly quests |
| ✶ Corruption Enema | Monthly progress diff report — tracks what improved and what failed |

### RPG System

- **Overall Level** calculated from combined XP across all skills
- **Class** auto-assigned based on your strongest skill (Cyber Operative, Shadow Wizard, Code Phantom, Zero Day Hunter)
- **Titles & Badges** unlocked by hitting real milestones (e.g. *"Ghost in the Shell"* for HTB Pro rank, *"Commit or Die"* for 100-day GitHub streak)
- **Coins** earned from completing quests

### Roadmaps

Two interactive visual roadmaps with 15 nodes each:

- **Cyber Roadmap** — Networking → Linux → Web → Exploitation → AD → Red Team → OSCP → Bug Bounty
- **AI Roadmap** — Python for ML → Neural Nets → Transformers → MLOps → Agent Systems → Research

Each node has a stage (Beginner → Elite), a summary, progression guidance, and a personal notes field.

### AI Features

- **Python Quiz** — AI-generated MCQs at your current level, with XP rewards for correct answers
- **AI/ML Quiz** — Adaptive challenges for your AI skill level
- **Lab Analyzer** — Paste lab notes and get an AI recommendation + milestone auto-detection
- **Project Rater** — Describe an AI project; AI rates complexity 1–5 and awards XP
- **Quest Generator** — AI generates personalized quests targeting your weakest skills

### Live Syncs

- **GitHub** — Syncs repos, contribution heatmap (84 days), streak, and top languages via GitHub GraphQL API
- **Hack The Box** — Syncs rank, machines pwned, and points via HTB API v4

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Build tool | Vite 8 |
| State | Zustand |
| Animations | Framer Motion |
| Charts | Recharts |
| Styling | Tailwind CSS v4 |
| Drag & Drop | dnd-kit |
| API routes | Vercel Serverless Functions |
| AI provider | OpenRouter (configurable model) |
| Deployment | Vercel |

---

## Running Locally

> **Note:** API routes (`/api/claude`, `/api/github`, `/api/htb`) are Vercel serverless functions. They only work via `vercel dev` locally. Running `npm run dev` alone will cause proxy errors for those routes — the UI and local data still work fine.

### Prerequisites

- Node.js 18+
- A [Vercel account](https://vercel.com) (for local API dev)
- API keys (see Environment Variables below)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/xr-station.git
cd xr-station

# 2. Install dependencies
npm install

# 3. Copy env file and fill in your keys
cp .env.example .env.local

# 4a. Run frontend only (no API syncing)
npm run dev

# 4b. Run with full API support (GitHub sync, HTB sync, AI features)
vercel dev
```

### Environment Variables

```env
GITHUB_TOKEN=            # GitHub personal access token (for GraphQL API)
OPENROUTER_API_KEY=      # OpenRouter key for AI features
OPENROUTER_MODEL=        # Default: tencent/hy3-preview:free
ANTHROPIC_API_KEY=       # Optional: direct Anthropic key
```

---

## Deployment

Deploy to Vercel in one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

The `api/` folder is automatically detected as serverless functions by Vercel. Set your environment variables in the Vercel dashboard under **Settings → Environment Variables**.

---

## Data & Privacy

All your progress data is stored in **localStorage** only — nothing is sent to any server. The only external calls made are:

- GitHub GraphQL API (for GitHub sync)
- HTB API v4 (for Hack The Box sync)
- OpenRouter/Anthropic API (for AI quiz and quest generation)

Clearing your browser's local storage will reset all data. Use the **Export** feature (if available) to back up your state.

---

## Known Limitations

- HTB sync requires a valid **numeric user ID** or the UUID from your profile URL. API v4 may return limited data depending on your HTB privacy settings.
- AI features require a valid `OPENROUTER_API_KEY` or `ANTHROPIC_API_KEY` set in environment variables.
- GitHub heatmap is based on the last 84 days of public contribution data.
- This app is designed as a **single-user personal dashboard** — there is no multi-user or cloud sync system.

---

## License

MIT — use it, fork it, hack it.
