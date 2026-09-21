# Contributing

Thank you for contributing to Aravt frontend.

## Before you start

1. Search existing issues and pull requests.
2. Open an issue before making a large architectural or product change.
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

Generated code such as `src/wrappers/Sell.ts` should be regenerated from its source contract rather than reformatted manually.

## Pull requests

- Keep each pull request focused.
- Explain behavior changes and how they were tested.
- Add screenshots for visible UI changes, but redact accounts, tokens, email addresses, and other personal data.
- Update documentation and `.env.example` when configuration changes.
- By submitting a contribution, you agree that it may be distributed under the repository's MIT License.

For security issues, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.
