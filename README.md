# CWG Progress

A raid progress tracker for the [Christian WoW Guilds (CWG)](https://www.warcraftlogs.com/guild/id/697334/) community. Displays raid progression statistics and recent updates for member guilds across current World of Warcraft content.

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- [React 19](https://react.dev/)
- [Chakra UI v3](https://chakra-ui.com/)
- Deployed on [Vercel](https://vercel.com/)

## Data Sources

- **[Raider.io API](https://raider.io/api)** — guild progression (bosses killed per difficulty) and raid/season metadata
- **[Warcraft Logs API](https://www.warcraftlogs.com/api/docs)** — encounter IDs, best pull data, kill timestamps, and CWG community logs
- **Google Sheets** — dynamic guild configuration via published CSV

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000/cwg-progress](http://localhost:3000/cwg-progress) in your browser.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `WLOGS_ACCESS_TOKEN` | Yes | Warcraft Logs API bearer token |
| `CRON_SECRET` | Yes | Secret for authenticating the cron endpoint |
| `DISCORD_WEBHOOK_URL` | Yes | Discord webhook URL for progress notifications |
| `RAIDERIO_ACCESS_KEY` | No | Raider.io API access key |
| `GOOGLE_SHEETS_GUILDS_CSV_URL` | No | Published CSV URL for dynamic guild config; falls back to hardcoded defaults |

## Deployment

Deployed automatically via the [Vercel Platform](https://vercel.com/).
