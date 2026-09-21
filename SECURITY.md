# Security policy

## Supported versions

Security fixes are applied to the latest commit on the default branch. This project has not yet published stable versioned releases.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability or leaked credential.

Use GitHub's private vulnerability reporting page:

<https://github.com/14zy/aravt-dev/security/advisories/new>

Include affected paths or versions, reproduction steps, impact, and any suggested remediation. Avoid accessing, changing, or downloading data that does not belong to you.

Maintainers should enable **Private vulnerability reporting** in the repository's GitHub security settings before making the repository public.

## Secrets

Values prefixed with `VITE_` are delivered to browsers and must never be treated as secrets. Server credentials belong in the backend's secret manager, not in this repository or its GitHub Actions variables unless a workflow explicitly needs them.
