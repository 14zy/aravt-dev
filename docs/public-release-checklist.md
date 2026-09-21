# Public release checklist

Complete every item before changing repository visibility to public.

## Ownership and privacy

- [ ] Every contributor or copyright holder has agreed to release their contribution under the MIT License.
- [ ] Brand names, logos, photos, videos, and other assets are owned by the project or have redistribution permission.
- [ ] Schema and documentation files contain no customer data, internal hostnames, private architecture details, or production exports.
- [ ] Commit author names and email addresses in Git history are acceptable for public disclosure.

## Credentials

- [ ] Rotate the database passwords, email/app passwords, API tokens, and other credentials stored in local environment or notes files.
- [ ] Verify that no secret appears in any branch, tag, commit, Git LFS object, release artifact, issue, pull request, Actions log, or Pages artifact.
- [ ] Keep local `*.env` files ignored; commit only `.env.example` with placeholders.
- [ ] Confirm that all frontend `VITE_*` values are intentionally public and restricted by scope, origin, and quota where supported.

## Automated checks

- [ ] Run `npm ci`, `npm run check`, and `npm run audit:prod` on a clean clone.
- [ ] Review the production bundle for unexpected URLs, keys, source maps, and private data.
- [ ] Enable Dependabot alerts and updates, secret scanning, push protection, and code scanning in GitHub.
- [ ] Enable private vulnerability reporting and branch protection for the default branch.

## Publication

- [ ] Review all previous GitHub Actions logs and artifacts; these become visible when a private repository becomes public.
- [ ] Confirm the repository description, topics, homepage, social preview, and support contacts.
- [ ] Create a tagged release only after CI succeeds on the public-ready commit.

This checklist reduces risk but is not legal advice or a guarantee that publication is risk-free.
