# Aravt frontend

Open-source React frontend for the Aravt collaboration platform. It includes team and project management, tasks, offers, profiles, a social feed, and TON wallet integration.

> [!IMPORTANT]
> This repository contains the frontend only. Authentication, user data, and business operations require a compatible backend API. The schema files in `docs/` are reference snapshots, not a complete backend or production migration set.

## Tech stack

- React and TypeScript
- Vite and Tailwind CSS
- Zustand for client state
- Axios for the backend API
- TON Connect and TON SDK packages for wallet features

## Requirements

- Node.js 20.19 or newer (Node.js 22 LTS is recommended)
- npm 10 or newer
- A compatible Aravt API for authenticated features

## Local setup

```bash
git clone https://github.com/14zy/aravt-dev.git
cd aravt-dev
npm ci
cp .env.example .env.local
npm run dev
```

Vite prints the local URL after startup. By default, API requests target `http://localhost:8001`.

## Configuration

All `VITE_*` values are compiled into browser code and are public. Never put database passwords, SMTP credentials, service-role keys, private keys, or other server secrets in these variables.

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | No | Backend API base URL; defaults to `http://localhost:8001` |
| `VITE_DISABLE_CACHE` | No | Set to `true` to disable client cache behavior |
| `VITE_TONCONNECT_MANIFEST_URL` | No | Public TON Connect manifest URL; defaults to this site's `/tonconnect-manifest.json` |
| `VITE_TOKEN_SELL_ADDRESS` | For token sales | Public TON contract address |
| `VITE_TONAPI_KEY` | No | Browser-visible, restricted TON API key; leave blank when possible |

If a credential must remain secret, keep it on the backend and expose only a narrowly scoped API endpoint to the frontend.

## Commands

```bash
npm run dev        # development server
npm run check      # lint and production build
npm run audit:prod # production dependency audit
npm run preview    # preview the production build
```

## Documentation

- [API notes](docs/api.md)
- [Database schema snapshot](docs/supabase_schema.sql)
- [SWR cache notes](docs/SWR.md)
- [Public release checklist](docs/public-release-checklist.md)

## Contributing and security

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Please report vulnerabilities privately as described in [SECURITY.md](SECURITY.md), not in a public issue.

## License

Licensed under the [MIT License](LICENSE).

## Whitepaper

https://docs.google.com/document/d/15ZrMssFJ4-qx8f6sZs1qY1BpR1Oh0UDSG0O1M3pR0GQ/edit?usp=sharing


## Official website

Visit Aravt.io to understand the project, read the whitepaper, and find links to the official app and social media channels.
