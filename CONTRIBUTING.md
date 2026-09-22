# Contributing

You are welcome to contribute to Aravt project. We appreciate your help in improving the project,please read this document before submitting a pull request.

## Before you start

1. Read the [README.md](README.md) and [SECURITY.md](SECURITY.md) files. Visit the [official website](https://aravt.io) to understand the project and read the [whitepaper](https://docs.google.com/document/d/15ZrMssFJ4-qx8f6sZs1qY1BpR1Oh0UDSG0O1M3pR0GQ/edit?usp=sharing). Subscribe to the Youtube channel and follow the Twitter account to stay up to date with announcements.
2. Fork the project or Open an issue before making a product change.
3. Do not include credentials, personal data, production exports, or proprietary assets in issues, commits, fixtures, or screenshots.

## Development

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Before opening a pull request, run:

```bash
npm run check
npm run audit:prod
```

## Pull requests

- Keep each pull request focused.
- Explain behavior changes and how they were tested.
- Add screenshots for visible UI changes, but redact accounts, tokens, email addresses, and other personal data.
- Update documentation and `.env.example` if configuration changes.
- By submitting a contribution, you agree that it may be distributed under the repository's MIT License.

For security issues, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.
